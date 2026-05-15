"use server";

import { redirect } from "next/navigation";
import { hash, compare } from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { checkLoginRateLimit, recordFailedLogin, clearLoginAttempts } from "@/lib/rate-limit";
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
    return { errors: validated.error.flatten().fieldErrors };
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
      channel: "WEB",
      ...(accountType === "BUSINESS" && businessName
        ? {
            business: {
              create: { name: businessName },
            },
          }
        : {}),
    },
  });

  await createSession({
    userId: user.id,
    accountType: user.accountType,
    name: user.name,
  });

  redirect("/dashboard");
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
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  // Rate limit: 10 attempts per email per 15 minutes
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

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout() {
  await deleteSession();
  redirect("/login");
}
