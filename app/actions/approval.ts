"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { notifyParties, notifyApprovalDeclined, notifyTransactionRefunded } from "@/lib/notifications";
import { dispatchWebhooks } from "@/lib/webhooks";

// ─── Respond to Disbursement Approval (buyer) ────────────────────────────────
// Buyer approves or declines admin's request to release escrowed funds to the
// seller. Approving finalizes the transaction (and resolves the linked dispute,
// if any); declining reverts to the prior status so admin can reconsider.

export async function respondToDisbursementApproval(txnId: string, formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: {
      parties: { where: { userId: session.userId } },
      disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } }, take: 1 },
    },
  });

  if (!transaction || transaction.parties.length === 0) {
    redirect(`/dashboard/transactions/${txnId}?error=not_found`);
  }

  const party = transaction!.parties[0];
  if (party.role !== "BUYER") {
    redirect(`/dashboard/transactions/${txnId}?error=wrong_role`);
  }
  if (transaction!.status !== "PENDING_DISBURSEMENT_APPROVAL") {
    redirect(`/dashboard/transactions/${txnId}?error=wrong_status`);
  }

  const decision = formData.get("decision") as string;

  if (decision === "APPROVE") {
    const dispute = transaction!.disputes[0];
    if (dispute) {
      await db.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "RESOLVED",
          resolution: transaction!.approvalNote,
          resolvedAt: new Date(),
          resolvedById: transaction!.approvalRequestedById,
        },
      });
    }

    await db.transaction.update({
      where: { id: txnId },
      data: {
        status: "COMPLETED",
        statusBeforeApproval: null,
        approvalRequestedAt: null,
        approvalRequestedById: null,
        approvalNote: null,
        statusLogs: {
          create: {
            fromStatus: "PENDING_DISBURSEMENT_APPROVAL",
            toStatus: "COMPLETED",
            actorId: session.userId,
            note: "Buyer approved — payment released to seller",
          },
        },
      },
    });

    await notifyParties(
      txnId,
      "TRANSACTION_COMPLETED",
      "Transaction completed",
      `The buyer approved releasing payment for "${transaction!.title}".`,
      session.userId
    );

    await dispatchWebhooks(txnId, "transaction.completed", {
      transaction: { id: txnId, title: transaction!.title, status: "COMPLETED" },
    });
  } else if (decision === "DECLINE") {
    const note = (formData.get("note") as string)?.trim();
    if (!note || note.length < 5) {
      redirect(`/dashboard/transactions/${txnId}?error=note_required`);
    }

    const revertStatus = transaction!.statusBeforeApproval ?? "DISPUTED";
    await db.transaction.update({
      where: { id: txnId },
      data: {
        status: revertStatus,
        approvalDeclinedAt: new Date(),
        approvalDeclineNote: note,
        approvalDeclineCount: { increment: 1 },
        approvalRequestedAt: null,
        approvalRequestedById: null,
        approvalNote: null,
        statusLogs: {
          create: {
            fromStatus: "PENDING_DISBURSEMENT_APPROVAL",
            toStatus: revertStatus,
            actorId: session.userId,
            note: `Buyer declined disbursement: ${note}`,
          },
        },
      },
    });

    if (transaction!.approvalRequestedById) {
      await notifyApprovalDeclined(
        transaction!.approvalRequestedById,
        "DISBURSEMENT_DECLINED",
        transaction!.title,
        note!,
        txnId
      );
    }
  } else {
    redirect(`/dashboard/transactions/${txnId}?error=invalid_decision`);
  }

  redirect(`/dashboard/transactions/${txnId}`);
}

// ─── Respond to Refund Approval (seller) ─────────────────────────────────────
// Seller approves or declines admin's request to refund the buyer. Approving
// finalizes the refund (and resolves the linked dispute, if any); declining
// reverts to the prior status so admin can reconsider.

export async function respondToRefundApproval(txnId: string, formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: {
      parties: { where: { userId: session.userId } },
      disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } }, take: 1 },
    },
  });

  if (!transaction || transaction.parties.length === 0) {
    redirect(`/dashboard/transactions/${txnId}?error=not_found`);
  }

  const party = transaction!.parties[0];
  if (party.role !== "SELLER") {
    redirect(`/dashboard/transactions/${txnId}?error=wrong_role`);
  }
  if (transaction!.status !== "PENDING_REFUND_APPROVAL") {
    redirect(`/dashboard/transactions/${txnId}?error=wrong_status`);
  }

  const decision = formData.get("decision") as string;

  if (decision === "APPROVE") {
    const dispute = transaction!.disputes[0];
    if (dispute) {
      await db.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "RESOLVED",
          resolution: transaction!.approvalNote,
          resolvedAt: new Date(),
          resolvedById: transaction!.approvalRequestedById,
        },
      });
    }

    await db.transaction.update({
      where: { id: txnId },
      data: {
        status: "REFUNDED",
        statusBeforeApproval: null,
        approvalRequestedAt: null,
        approvalRequestedById: null,
        approvalNote: null,
        statusLogs: {
          create: {
            fromStatus: "PENDING_REFUND_APPROVAL",
            toStatus: "REFUNDED",
            actorId: session.userId,
            note: "Seller approved — payment refunded to buyer",
          },
        },
      },
    });

    await notifyTransactionRefunded(
      txnId,
      transaction!.title,
      transaction!.amount.toString(),
      session.userId
    );
  } else if (decision === "DECLINE") {
    const note = (formData.get("note") as string)?.trim();
    if (!note || note.length < 5) {
      redirect(`/dashboard/transactions/${txnId}?error=note_required`);
    }

    const revertStatus = transaction!.statusBeforeApproval ?? "DISPUTED";
    await db.transaction.update({
      where: { id: txnId },
      data: {
        status: revertStatus,
        approvalDeclinedAt: new Date(),
        approvalDeclineNote: note,
        approvalDeclineCount: { increment: 1 },
        approvalRequestedAt: null,
        approvalRequestedById: null,
        approvalNote: null,
        statusLogs: {
          create: {
            fromStatus: "PENDING_REFUND_APPROVAL",
            toStatus: revertStatus,
            actorId: session.userId,
            note: `Seller declined refund: ${note}`,
          },
        },
      },
    });

    if (transaction!.approvalRequestedById) {
      await notifyApprovalDeclined(
        transaction!.approvalRequestedById,
        "REFUND_DECLINED",
        transaction!.title,
        note!,
        txnId
      );
    }
  } else {
    redirect(`/dashboard/transactions/${txnId}?error=invalid_decision`);
  }

  redirect(`/dashboard/transactions/${txnId}`);
}
