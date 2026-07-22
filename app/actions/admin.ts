"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashToken } from "@/lib/token";
import { notifyParties } from "@/lib/notifications";
import { sendEmail, emailPasswordReset, emailClaimAccount } from "@/lib/email";

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "ADMIN" && session.accountType !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return session;
}

// ─── Confirm Payment ──────────────────────────────────────────────────────────

export async function adminConfirmPayment(txnId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const note = (formData.get("note") as string)?.trim() || "Payment confirmed by admin";

  const transaction = await db.transaction.findUnique({ where: { id: txnId } });
  if (!transaction || transaction.status !== "AWAITING_PAYMENT") {
    redirect(`/admin/transactions/${txnId}?error=wrong_status`);
  }

  await db.payment.create({
    data: {
      transactionId: txnId,
      amount: transaction.amount,
      status: "CONFIRMED",
      confirmedAt: new Date(),
      confirmedById: session.userId,
      note,
    },
  });
  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "FUNDED",
      statusLogs: {
        create: {
          fromStatus: "AWAITING_PAYMENT",
          toStatus: "FUNDED",
          actorId: session.userId,
          note,
        },
      },
    },
  });

  await notifyParties(
    txnId,
    "PAYMENT_CONFIRMED",
    "Payment confirmed — escrow funded",
    `Payment for "${transaction!.title}" has been confirmed. The escrow is now funded.`
  );

  redirect(`/admin/transactions/${txnId}`);
}

// ─── Mark Refunded ────────────────────────────────────────────────────────────

export async function adminMarkRefunded(txnId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const note = (formData.get("note") as string)?.trim() || "Refunded by admin";

  const refundable = ["FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION", "DISPUTED"];
  const transaction = await db.transaction.findUnique({ where: { id: txnId } });
  if (!transaction || !refundable.includes(transaction.status)) {
    redirect(`/admin/transactions/${txnId}?error=wrong_status`);
  }

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "REFUNDED",
      adminNote: note,
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "REFUNDED",
          actorId: session.userId,
          note,
        },
      },
    },
  });

  redirect(`/admin/transactions/${txnId}`);
}

// ─── Cancel Transaction (admin) ───────────────────────────────────────────────

export async function adminCancelTransaction(txnId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const note = (formData.get("note") as string)?.trim() || "Cancelled by admin";

  const cancellable = ["CREATED", "AWAITING_PAYMENT"];
  const transaction = await db.transaction.findUnique({ where: { id: txnId } });
  if (!transaction || !cancellable.includes(transaction.status)) {
    redirect(`/admin/transactions/${txnId}?error=wrong_status`);
  }

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "CANCELLED",
      adminNote: note,
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "CANCELLED",
          actorId: session.userId,
          note,
        },
      },
    },
  });

  redirect(`/admin/transactions/${txnId}`);
}

// ─── Resolve Dispute ──────────────────────────────────────────────────────────

export async function adminResolveDispute(txnId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const outcome = formData.get("outcome") as string;
  const resolution = (formData.get("resolution") as string)?.trim() || "Resolved by admin";

  if (!["COMPLETED", "REFUNDED"].includes(outcome)) {
    redirect(`/admin/transactions/${txnId}?error=invalid_outcome`);
  }

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: {
      disputes: {
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        take: 1,
      },
    },
  });

  if (!transaction || transaction.status !== "DISPUTED") {
    redirect(`/admin/transactions/${txnId}?error=wrong_status`);
  }

  const dispute = transaction.disputes[0];

  if (dispute) {
    await db.dispute.update({
      where: { id: dispute.id },
      data: {
        status: "RESOLVED",
        resolution,
        resolvedAt: new Date(),
        resolvedById: session.userId,
      },
    });
  }
  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: outcome as "COMPLETED" | "REFUNDED",
      adminNote: resolution,
      statusLogs: {
        create: {
          fromStatus: "DISPUTED",
          toStatus: outcome as "COMPLETED" | "REFUNDED",
          actorId: session.userId,
          note: `Dispute resolved: ${resolution}`,
        },
      },
    },
  });

  await notifyParties(
    txnId,
    "DISPUTE_RESOLVED",
    "Dispute resolved",
    `The dispute on "${transaction!.title}" has been resolved.`
  );

  redirect(`/admin/transactions/${txnId}`);
}

// ─── Update Global Fee Config ─────────────────────────────────────────────────

type FeeActionState =
  | { success?: boolean; message?: string; errors?: Record<string, string[]> }
  | undefined;

const FeeSchema = z.object({
  feeType: z.enum(["PERCENTAGE", "FIXED", "FREE"]),
  feeValue: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, "Enter a valid number (e.g. 1.5).")
    .optional(),
});

export async function adminUpdateFeeConfig(
  _state: FeeActionState,
  formData: FormData
): Promise<FeeActionState> {
  await requireAdmin();

  const raw = {
    feeType: formData.get("feeType"),
    feeValue: (formData.get("feeValue") as string) || "0",
  };

  const validated = FeeSchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  const { feeType, feeValue } = validated.data;
  const numericValue = Number(feeValue ?? 0);

  const existing = await db.feeConfig.findFirst({ where: { businessId: null } });

  if (existing) {
    await db.feeConfig.update({
      where: { id: existing.id },
      data: { feeType, feeValue: numericValue, isFree: feeType === "FREE" },
    });
  } else {
    await db.feeConfig.create({
      data: { feeType, feeValue: numericValue, isFree: feeType === "FREE" },
    });
  }

  return { success: true, message: "Fee configuration updated." };
}

// ─── User Management ──────────────────────────────────────────────────────────

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "SUPER_ADMIN") redirect("/admin/users");
  return session;
}

export async function adminSuspendUser(userId: string, _formData: FormData): Promise<void> {
  await requireAdmin();
  const user = await db.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  if (!user || user.accountType === "SUPER_ADMIN") redirect(`/admin/users/${userId}?error=forbidden`);
  await db.user.update({ where: { id: userId }, data: { accountStatus: "SUSPENDED" } });
  redirect(`/admin/users/${userId}?success=suspended`);
}

export async function adminActivateUser(userId: string, _formData: FormData): Promise<void> {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { accountStatus: "ACTIVE" } });
  redirect(`/admin/users/${userId}?success=activated`);
}

export async function adminPromoteUser(userId: string, _formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const user = await db.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  if (!user || user.accountType === "SUPER_ADMIN" || user.accountType === "ADMIN") {
    redirect(`/admin/users/${userId}?error=forbidden`);
  }
  await db.user.update({ where: { id: userId }, data: { accountType: "ADMIN" } });
  redirect(`/admin/users/${userId}?success=promoted`);
}

export async function adminDemoteUser(userId: string, _formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const user = await db.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  if (!user || user.accountType !== "ADMIN") redirect(`/admin/users/${userId}?error=forbidden`);
  await db.user.update({ where: { id: userId }, data: { accountType: "PERSONAL" } });
  redirect(`/admin/users/${userId}?success=demoted`);
}

export async function adminSendPasswordReset(userId: string, _formData: FormData): Promise<void> {
  await requireAdmin();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isClaimed: true },
  });
  if (!user || !user.email) redirect(`/admin/users/${userId}?error=no_email`);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://vaultlify.com";
  const token = randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: userId },
    data: { resetToken: hashToken(token), resetTokenExp: new Date(Date.now() + 60 * 60 * 1000) },
  });
  await sendEmail({
    to: user!.email!,
    subject: "Reset your Vaultlify password",
    html: emailPasswordReset(user!.name, `${base}/claim/reset?token=${token}`),
  });
  redirect(`/admin/users/${userId}?success=reset_sent`);
}

export async function adminResendClaimEmail(userId: string, _formData: FormData): Promise<void> {
  await requireAdmin();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isClaimed: true },
  });
  if (!user || user.isClaimed || !user.email) redirect(`/admin/users/${userId}?error=not_shadow`);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://vaultlify.com";
  const token = randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: userId },
    data: { claimToken: hashToken(token), claimTokenExp: new Date(Date.now() + 48 * 60 * 60 * 1000) },
  });
  await sendEmail({
    to: user!.email!,
    subject: "Secure your Vaultlify account",
    html: emailClaimAccount(user!.name, `${base}/claim?token=${token}`),
  });
  redirect(`/admin/users/${userId}?success=claim_sent`);
}
