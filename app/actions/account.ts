"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getSession, createSession } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";

type ActionState = { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined;

// ─── Claim Account (shadow user sets a password) ──────────────────────────────

const ClaimSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export async function claimAccount(_state: ActionState, formData: FormData): Promise<ActionState> {
  const token = (formData.get("claimToken") as string) || null;

  let user: { id: string; accountType: string; name: string; isClaimed: boolean } | null = null;

  if (token) {
    // Token-based path: user clicked the email link on a device with no session
    const found = await db.user.findFirst({
      where: { claimToken: token },
      select: { id: true, accountType: true, name: true, isClaimed: true, claimTokenExp: true },
    });
    if (!found || found.isClaimed) return { message: "This link is invalid or has already been used." };
    if (!found.claimTokenExp || found.claimTokenExp < new Date()) {
      return { message: "This link has expired. Please contact support to get a new one." };
    }
    user = found;
  } else {
    // Session-based path: user is already logged in as a shadow account
    const session = await getSession();
    if (!session) redirect("/login");
    const found = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, accountType: true, name: true, isClaimed: true },
    });
    if (!found) redirect("/login");
    if (found.isClaimed) return { message: "Your account is already fully set up." };
    user = found;
  }

  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validated = ClaimSchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors as Record<string, string[]> };

  const { password } = validated.data;
  const passwordHash = await hash(password, 12);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, isClaimed: true, claimToken: null, claimTokenExp: null },
  });

  await createSession({
    userId: user.id,
    accountType: user.accountType as "PERSONAL" | "BUSINESS",
    name: user.name,
  });

  await notifyUser(
    user.id,
    "ACCOUNT_CLAIMED",
    "Account secured",
    "Your SafePay account is now fully set up. Welcome to SafePay!"
  );

  redirect("/dashboard?claimed=1");
}

// ─── Update Profile ───────────────────────────────────────────────────────────

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").trim(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
});

export async function updateProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const raw = {
    name: formData.get("name"),
    phone: (formData.get("phone") as string) || undefined,
  };

  const validated = ProfileSchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  const { name, phone } = validated.data;

  // Check phone uniqueness if changed
  if (phone) {
    const existing = await db.user.findUnique({ where: { phone } });
    if (existing && existing.id !== session.userId) {
      return { errors: { phone: ["This phone number is already in use."] } };
    }
  }

  await db.user.update({
    where: { id: session.userId },
    data: { name, phone: phone || null },
  });

  // Refresh session to reflect new name
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (user) {
    await createSession({ userId: user.id, accountType: user.accountType, name: user.name });
  }

  return { success: true, message: "Profile updated." };
}

// ─── Change Password ──────────────────────────────────────────────────────────

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export async function changePassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user?.passwordHash) return { message: "Set a password first using the claim flow." };

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validated = PasswordSchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  const { currentPassword, newPassword } = validated.data;

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) return { errors: { currentPassword: ["Incorrect password."] } };

  const passwordHash = await hash(newPassword, 12);
  await db.user.update({ where: { id: session.userId }, data: { passwordHash } });

  return { success: true, message: "Password updated successfully." };
}

// ─── Update Business Profile ──────────────────────────────────────────────────

const BusinessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters.").trim(),
  description: z.string().max(500).optional(),
  website: z.string().url("Enter a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
});

export async function updateBusinessProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "BUSINESS") return { message: "Only business accounts can update business details." };

  const raw = {
    name: formData.get("name"),
    description: (formData.get("description") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
  };

  const validated = BusinessSchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  const { name, description, website } = validated.data;

  const existing = await db.business.findUnique({ where: { userId: session.userId } });

  if (existing) {
    await db.business.update({
      where: { userId: session.userId },
      data: { name, description: description ?? null, website: website || null },
    });
  } else {
    await db.business.create({
      data: {
        userId: session.userId,
        name,
        description: description ?? null,
        website: website || null,
      },
    });
  }

  return { success: true, message: "Business profile updated." };
}

// ─── Generate API Key ─────────────────────────────────────────────────────────

const ApiKeySchema = z.object({
  label: z.string().min(1, "Give this key a label.").max(50).trim(),
});

export async function generateApiKey(_state: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "BUSINESS") return { message: "Only business accounts can generate API keys." };

  const raw = { label: formData.get("label") };
  const validated = ApiKeySchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  const { label } = validated.data;

  // Generate key: sp_live_<32 random hex chars>
  const rawKey = `sp_live_${randomBytes(16).toString("hex")}`;
  const prefix = rawKey.slice(0, 15); // "sp_live_xxxxxxx" visible in UI
  const keyHash = await hash(rawKey, 10);

  await db.apiKey.create({
    data: {
      userId: session.userId,
      prefix,
      keyHash,
      label,
    },
  });

  // Return the full key just this once — it won't be retrievable again
  return { success: true, message: rawKey };
}

// ─── Deactivate API Key ───────────────────────────────────────────────────────

export async function deactivateApiKey(keyId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const key = await db.apiKey.findUnique({ where: { id: keyId } });
  if (!key || key.userId !== session.userId) redirect("/dashboard/settings/api-keys");

  await db.apiKey.update({ where: { id: keyId }, data: { isActive: false } });
  redirect("/dashboard/settings/api-keys");
}

// ─── Add Webhook ──────────────────────────────────────────────────────────────

const VALID_EVENTS = [
  "transaction.created",
  "transaction.funded",
  "transaction.delivered",
  "transaction.completed",
  "transaction.disputed",
  "transaction.cancelled",
  "payment.confirmed",
  "dispute.resolved",
];

const WebhookSchema = z.object({
  url: z.string().url("Enter a valid HTTPS URL.").refine((u) => u.startsWith("https://"), "Webhook URL must use HTTPS."),
  events: z.array(z.string()).min(1, "Select at least one event."),
});

export async function addWebhook(_state: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "BUSINESS") return { message: "Only business accounts can add webhooks." };

  const business = await db.business.findUnique({ where: { userId: session.userId } });
  if (!business) return { message: "Set up your business profile first." };

  const selectedEvents = formData.getAll("events") as string[];
  const raw = { url: formData.get("url"), events: selectedEvents };

  const validated = WebhookSchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  const { url, events } = validated.data;
  const validEvents = events.filter((e) => VALID_EVENTS.includes(e));

  const secret = randomBytes(24).toString("hex");

  await db.webhook.create({
    data: {
      businessId: business.id,
      url,
      events: validEvents,
      secret,
    },
  });

  return { success: true, message: "Webhook added." };
}

// ─── Delete Webhook ───────────────────────────────────────────────────────────

export async function deleteWebhook(webhookId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const business = await db.business.findUnique({ where: { userId: session.userId } });
  if (!business) redirect("/dashboard/settings/webhooks");

  await db.webhook.deleteMany({ where: { id: webhookId, businessId: business.id } });
  redirect("/dashboard/settings/webhooks");
}
