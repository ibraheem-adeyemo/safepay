"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { hashToken } from "@/lib/token";
import { sendEmail, emailVerifyAccount } from "@/lib/email";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  checkRegistrationRateLimit,
  recordRegistrationAttempt,
} from "@/lib/rate-limit";
import {
  RegisterSchema,
  LoginSchema,
  type AuthActionState,
} from "@/lib/auth/definitions";

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  const allowed = await checkRegistrationRateLimit(ip);
  if (!allowed) {
    return { message: "Too many accounts created from this network. Please try again later." };
  }
  await recordRegistrationAttempt(ip);

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || "",
    accountType: formData.get("accountType"),
    businessName: formData.get("businessName") || undefined,
  };

  const validated = RegisterSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const { name, email, password, phone, accountType, businessName } = validated.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  if (phone) {
    const existingPhone = await db.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return { errors: { phone: ["This phone number is already registered."] } };
    }
  }

  if (accountType === "BUSINESS" && !businessName) {
    return { errors: { businessName: ["Business name is required."] } };
  }

  const passwordHash = await hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone: phone || null,
      accountType,
      isClaimed: true,
      emailVerified: false,
      channel: "WEB",
      ...(accountType === "BUSINESS" && businessName
        ? { business: { create: { name: businessName } } }
        : {}),
    },
  });

  // Generate a 24-hour verification token and email it
  const verifyToken = randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: user.id },
    data: {
      verifyToken: hashToken(verifyToken),
      verifyTokenExp: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://vaultlify.com";
  await sendEmail({
    to: email,
    subject: "Verify your Vaultlify email address",
    html: emailVerifyAccount(name, `${base}/verify?token=${verifyToken}`),
  });

  redirect("/check-email");
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = LoginSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const { email, password } = validated.data;

  const allowed = await checkLoginRateLimit(email, "unknown");
  if (!allowed) {
    return { message: "Too many login attempts. Please try again in 15 minutes." };
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    await recordFailedLogin(email, "unknown");
    return { message: "Invalid email or password." };
  }

  if (user.accountStatus === "SUSPENDED") {
    return { message: "Your account has been suspended. Contact support." };
  }

  const passwordMatch = await compare(password, user.passwordHash);
  if (!passwordMatch) {
    await recordFailedLogin(email, "unknown");
    return { message: "Invalid email or password." };
  }

  if (!user.emailVerified) {
    return {
      needsVerification: true,
      verificationEmail: email,
      message: "Please verify your email address before signing in.",
    };
  }

  await clearLoginAttempts(email);

  await createSession({
    userId: user.id,
    accountType: user.accountType,
    name: user.name,
  });

  const destination =
    user.accountType === "ADMIN" || user.accountType === "SUPER_ADMIN"
      ? "/admin"
      : "/dashboard";

  redirect(destination);
}

// ─── Confirm Email Verification (POST — consumes the token) ───────────────────
// Only called from the verify page form submit, never from a GET request.
// This prevents email security scanners from consuming the token by pre-fetching links.

export async function confirmVerificationEmail(
  token: string,
  _formData: FormData
): Promise<void> {
  if (!token) {
    redirect("/verify?status=invalid");
  }

  const user = await db.user.findFirst({
    where: { verifyToken: hashToken(token) },
    select: { id: true, verifyTokenExp: true, emailVerified: true },
  });

  if (!user) {
    redirect("/verify?status=invalid");
  }

  if (user!.emailVerified) {
    redirect("/login?verified=1");
  }

  if (!user!.verifyTokenExp || user!.verifyTokenExp < new Date()) {
    redirect("/verify?status=expired");
  }

  await db.user.update({
    where: { id: user!.id },
    data: { emailVerified: true, verifyToken: null, verifyTokenExp: null },
  });

  redirect("/login?verified=1");
}

// ─── Resend Verification Email ────────────────────────────────────────────────

export async function resendVerificationEmail(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  if (!email) return { errors: { email: ["Email is required."] } };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, emailVerified: true, channel: true },
  });

  // Always return the same message — never reveal whether an account exists
  const genericSuccess = {
    message: "If that email has an unverified account, a new verification link is on its way.",
  };

  if (!user || user.emailVerified || user.channel !== "WEB") {
    return genericSuccess;
  }

  const verifyToken = randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: user.id },
    data: {
      verifyToken: hashToken(verifyToken),
      verifyTokenExp: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://vaultlify.com";
  await sendEmail({
    to: email,
    subject: "Verify your Vaultlify email address",
    html: emailVerifyAccount(user.name, `${base}/verify?token=${verifyToken}`),
  });

  return genericSuccess;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout() {
  await deleteSession();
  redirect("/login");
}
