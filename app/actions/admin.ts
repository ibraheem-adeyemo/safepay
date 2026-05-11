"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { TransactionStatus } from "@prisma/client";

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

  redirect(`/admin/transactions/${txnId}`);
}

// ─── Mark Refunded ────────────────────────────────────────────────────────────

export async function adminMarkRefunded(txnId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const note = (formData.get("note") as string)?.trim() || "Refunded by admin";

  const refundable: TransactionStatus[] = [
    "FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION", "DISPUTED",
  ];
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

  const cancellable: TransactionStatus[] = ["CREATED", "AWAITING_PAYMENT"];
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
      status: outcome as TransactionStatus,
      adminNote: resolution,
      statusLogs: {
        create: {
          fromStatus: "DISPUTED",
          toStatus: outcome as TransactionStatus,
          actorId: session.userId,
          note: `Dispute resolved: ${resolution}`,
        },
      },
    },
  });

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
