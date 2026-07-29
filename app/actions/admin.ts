"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashToken } from "@/lib/token";
import { notifyParties, notifyApprovalRequested, notifyTransactionRefunded } from "@/lib/notifications";
import { dispatchWebhooks } from "@/lib/webhooks";
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
// Doesn't refund directly — requests the seller's approval first, since they're
// the one giving up their claim to the funds.

export async function adminMarkRefunded(txnId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const note = (formData.get("note") as string)?.trim();
  if (!note) redirect(`/admin/transactions/${txnId}?error=note_required`);

  const refundable = ["FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION", "RECEIPT_CONFIRMED", "DISPUTED"];
  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: { where: { role: "SELLER" } } },
  });
  if (!transaction || !refundable.includes(transaction.status)) {
    redirect(`/admin/transactions/${txnId}?error=wrong_status`);
  }

  const seller = transaction!.parties[0];
  if (!seller) redirect(`/admin/transactions/${txnId}?error=no_seller`);

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "PENDING_REFUND_APPROVAL",
      statusBeforeApproval: transaction!.status,
      approvalRequestedAt: new Date(),
      approvalRequestedById: session.userId,
      approvalNote: note,
      statusLogs: {
        create: {
          fromStatus: transaction!.status,
          toStatus: "PENDING_REFUND_APPROVAL",
          actorId: session.userId,
          note: `Admin requested seller approval to refund: ${note}`,
        },
      },
    },
  });

  await notifyApprovalRequested(
    seller!.userId,
    "REFUND_APPROVAL_REQUESTED",
    transaction!.title,
    note,
    txnId
  );

  redirect(`/admin/transactions/${txnId}`);
}

// ─── Initiate Disbursement ────────────────────────────────────────────────────
// Standalone counterpart to Mark Refunded — requests the buyer's approval to
// release funds to the seller, available any time funds are in escrow (not
// just once a dispute exists).

export async function adminInitiateDisbursement(txnId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const note = (formData.get("note") as string)?.trim();
  if (!note) redirect(`/admin/transactions/${txnId}?error=note_required`);

  const disbursable = ["FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION", "RECEIPT_CONFIRMED", "DISPUTED"];
  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: { where: { role: "BUYER" } } },
  });
  if (!transaction || !disbursable.includes(transaction.status)) {
    redirect(`/admin/transactions/${txnId}?error=wrong_status`);
  }

  const buyer = transaction!.parties[0];
  if (!buyer) redirect(`/admin/transactions/${txnId}?error=no_buyer`);

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "PENDING_DISBURSEMENT_APPROVAL",
      statusBeforeApproval: transaction!.status,
      approvalRequestedAt: new Date(),
      approvalRequestedById: session.userId,
      approvalNote: note,
      statusLogs: {
        create: {
          fromStatus: transaction!.status,
          toStatus: "PENDING_DISBURSEMENT_APPROVAL",
          actorId: session.userId,
          note: `Admin requested buyer approval to release funds: ${note}`,
        },
      },
    },
  });

  await notifyApprovalRequested(
    buyer!.userId,
    "DISBURSEMENT_APPROVAL_REQUESTED",
    transaction!.title,
    note,
    txnId
  );

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
// Doesn't resolve directly — requests approval from whichever party stands to
// lose their claim to the funds (buyer for a release, seller for a refund).
// The dispute itself stays open until that party approves.

export async function adminResolveDispute(txnId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const outcome = formData.get("outcome") as string;
  const resolution = (formData.get("resolution") as string)?.trim() || "Resolved by admin";

  if (!["COMPLETED", "REFUNDED"].includes(outcome)) {
    redirect(`/admin/transactions/${txnId}?error=invalid_outcome`);
  }

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: true },
  });

  if (!transaction || transaction.status !== "DISPUTED") {
    redirect(`/admin/transactions/${txnId}?error=wrong_status`);
  }

  const targetRole = outcome === "COMPLETED" ? "BUYER" : "SELLER";
  const targetParty = transaction!.parties.find((p) => p.role === targetRole);
  if (!targetParty) redirect(`/admin/transactions/${txnId}?error=no_${targetRole.toLowerCase()}`);

  const pendingStatus = outcome === "COMPLETED" ? "PENDING_DISBURSEMENT_APPROVAL" : "PENDING_REFUND_APPROVAL";
  const notifType = outcome === "COMPLETED" ? "DISBURSEMENT_APPROVAL_REQUESTED" : "REFUND_APPROVAL_REQUESTED";

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: pendingStatus,
      statusBeforeApproval: "DISPUTED",
      approvalRequestedAt: new Date(),
      approvalRequestedById: session.userId,
      approvalNote: resolution,
      statusLogs: {
        create: {
          fromStatus: "DISPUTED",
          toStatus: pendingStatus,
          actorId: session.userId,
          note: `Admin requested ${targetRole.toLowerCase()} approval to ${
            outcome === "COMPLETED" ? "release funds" : "refund"
          }: ${resolution}`,
        },
      },
    },
  });

  await notifyApprovalRequested(targetParty!.userId, notifType, transaction!.title, resolution, txnId);

  redirect(`/admin/transactions/${txnId}`);
}

// ─── Force Approval Outcome (super admin override) ───────────────────────────
// Last-resort escape hatch for a stuck PENDING_*_APPROVAL transaction — a party
// declining repeatedly or never responding. Always logged and always notifies
// both parties so the override is never silent.

export async function adminForceApprovalOutcome(txnId: string, formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const note = (formData.get("note") as string)?.trim();
  if (!note) redirect(`/admin/transactions/${txnId}?error=note_required`);

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: {
      disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } }, take: 1 },
    },
  });

  const pendingStatuses = ["PENDING_DISBURSEMENT_APPROVAL", "PENDING_REFUND_APPROVAL"];
  if (!transaction || !pendingStatuses.includes(transaction.status)) {
    redirect(`/admin/transactions/${txnId}?error=wrong_status`);
  }

  const outcome = transaction!.status === "PENDING_DISBURSEMENT_APPROVAL" ? "COMPLETED" : "REFUNDED";
  const dispute = transaction!.disputes[0];

  if (dispute) {
    await db.dispute.update({
      where: { id: dispute.id },
      data: {
        status: "RESOLVED",
        resolution: transaction!.approvalNote,
        resolvedAt: new Date(),
        resolvedById: session.userId,
      },
    });
  }

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: outcome,
      adminNote: note,
      statusBeforeApproval: null,
      approvalRequestedAt: null,
      approvalRequestedById: null,
      approvalNote: null,
      forcedApprovalAt: new Date(),
      forcedApprovalById: session.userId,
      forcedApprovalNote: note,
      statusLogs: {
        create: {
          fromStatus: transaction!.status,
          toStatus: outcome,
          actorId: session.userId,
          note: `Forced by super admin: ${note}`,
        },
      },
    },
  });

  if (outcome === "COMPLETED") {
    await notifyParties(
      txnId,
      "TRANSACTION_COMPLETED",
      "Transaction completed",
      `A super admin has released payment on "${transaction!.title}". Reason: ${note}`
    );
    await dispatchWebhooks(txnId, "transaction.completed", {
      transaction: { id: txnId, title: transaction!.title, status: "COMPLETED" },
    });
  } else {
    await notifyTransactionRefunded(txnId, transaction!.title, transaction!.amount.toString());
  }

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
