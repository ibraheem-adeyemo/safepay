import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  emailTransactionCreated,
  emailCounterpartyJoined,
  emailYouJoined,
  emailPaymentConfirmed,
  emailItemDelivered,
  emailTransactionCompleted,
  emailDisputeRaised,
  emailDisputeResolved,
  emailTransactionCancelled,
  emailApprovalRequested,
  emailApprovalDeclined,
  emailTransactionRefunded,
  emailReceiptConfirmed,
} from "@/lib/email";

type NotificationType =
  | "TRANSACTION_CREATED"
  | "TRANSACTION_FUNDED"
  | "TRANSACTION_DELIVERED"
  | "TRANSACTION_COMPLETED"
  | "TRANSACTION_DISPUTED"
  | "TRANSACTION_CANCELLED"
  | "PAYMENT_CONFIRMED"
  | "DISPUTE_RAISED"
  | "DISPUTE_RESOLVED"
  | "ACCOUNT_CLAIMED"
  | "DISBURSEMENT_APPROVAL_REQUESTED"
  | "REFUND_APPROVAL_REQUESTED"
  | "DISBURSEMENT_DECLINED"
  | "REFUND_DECLINED"
  | "TRANSACTION_REFUNDED"
  | "RECEIPT_CONFIRMED";

// Map notification type + context to the right email template HTML.
// Returns null when no email should be sent for that type.
function renderEmail(
  type: NotificationType,
  user: { name: string },
  title: string,
  transactionId: string | null
): string | null {
  // For notification types that need the transaction title, we embed it in the
  // notification body that was already composed by the caller.
  const txId = transactionId;

  switch (type) {
    case "TRANSACTION_CREATED":
      // Could be "created by you" or "you've joined" — we use the generic title/body
      // The specific variants are handled by dedicated helpers below when callers pass
      // enough context. Here we fall through to the generic template.
      return null; // callers use notifyUserWithEmail for richer context
    case "PAYMENT_CONFIRMED":
      return txId
        ? emailPaymentConfirmed(user.name, title, "", txId)
        : null;
    case "TRANSACTION_DELIVERED":
      return txId ? emailItemDelivered(user.name, title, txId) : null;
    case "RECEIPT_CONFIRMED":
      return txId ? emailReceiptConfirmed(user.name, title, txId) : null;
    case "TRANSACTION_COMPLETED":
      return txId ? emailTransactionCompleted(user.name, title, "", txId) : null;
    case "DISPUTE_RAISED":
      return txId ? emailDisputeRaised(user.name, title, txId) : null;
    case "DISPUTE_RESOLVED":
      return txId ? emailDisputeResolved(user.name, title, txId) : null;
    case "TRANSACTION_CANCELLED":
      return emailTransactionCancelled(user.name, title);
    default:
      return null;
  }
}

export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  transactionId?: string
) {
  try {
    const [, user] = await Promise.all([
      db.notification.create({
        data: { userId, type, title, body, transactionId: transactionId ?? null },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      }),
    ]);

    if (user?.email) {
      const html = renderEmail(type, user, title, transactionId ?? null);
      if (html) {
        await sendEmail({ to: user.email, subject: title, html });
      }
    }
  } catch {
    // Notifications are best-effort — never break the main action
  }
}

// Notify every party on a transaction, optionally excluding one user
export async function notifyParties(
  txnId: string,
  type: NotificationType,
  title: string,
  body: string,
  excludeUserId?: string
) {
  try {
    const parties = await db.transactionParty.findMany({
      where: { transactionId: txnId },
      select: {
        userId: true,
        user: { select: { email: true, name: true } },
      },
    });

    const eligible = parties.filter((p) => p.userId !== excludeUserId);
    if (eligible.length === 0) return;

    await db.notification.createMany({
      data: eligible.map(({ userId }) => ({
        userId,
        type,
        title,
        body,
        transactionId: txnId,
      })),
    });

    // Send email to each eligible party
    await Promise.allSettled(
      eligible
        .filter((p) => p.user.email)
        .map((p) => {
          const html = renderEmail(type, p.user, title, txnId);
          if (!html) return Promise.resolve();
          return sendEmail({ to: p.user.email!, subject: title, html });
        })
    );
  } catch {
    // Best-effort
  }
}

// ─── Richer notification helpers — called by accept actions ──────────────────
// These have the full context (title, amount, role) needed for specific templates.

export async function notifyTransactionCreated(
  userId: string,
  title: string,
  amount: string,
  txnId: string
) {
  try {
    const [, user] = await Promise.all([
      db.notification.create({
        data: {
          userId,
          type: "TRANSACTION_CREATED",
          title: "Transaction created",
          body: `Your escrow for "${title}" is ready. Share the invite link with the other party.`,
          transactionId: txnId,
        },
      }),
      db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
    ]);

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Your Vaultlify escrow is ready",
        html: emailTransactionCreated(user.name, title, amount, txnId),
      });
    }
  } catch {
    // Best-effort
  }
}

export async function notifyCounterpartyJoined(
  initiatorId: string,
  counterpartyName: string,
  title: string,
  counterpartyRole: string,
  txnId: string
) {
  try {
    const [, user] = await Promise.all([
      db.notification.create({
        data: {
          userId: initiatorId,
          type: "TRANSACTION_CREATED",
          title: "Your counterparty has joined",
          body: `${counterpartyName} joined "${title}" as the ${counterpartyRole.toLowerCase()}. The escrow is now active.`,
          transactionId: txnId,
        },
      }),
      db.user.findUnique({ where: { id: initiatorId }, select: { email: true, name: true } }),
    ]);

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Your counterparty has joined",
        html: emailCounterpartyJoined(user.name, counterpartyName, title, counterpartyRole, txnId),
      });
    }
  } catch {
    // Best-effort
  }
}

// Notify a single party (the one being asked to give up their claim to the
// funds) that admin has requested their approval before money moves.
export async function notifyApprovalRequested(
  targetUserId: string,
  type: "DISBURSEMENT_APPROVAL_REQUESTED" | "REFUND_APPROVAL_REQUESTED",
  title: string,
  note: string,
  txnId: string
) {
  try {
    const kind = type === "DISBURSEMENT_APPROVAL_REQUESTED" ? "disbursement" : "refund";
    const notifTitle =
      kind === "disbursement"
        ? "Your approval is needed to release funds"
        : "Your approval is needed to issue a refund";
    const body = `We'd like to ${
      kind === "disbursement" ? "release funds to the seller" : "refund the buyer"
    } for "${title}". Reason: ${note}`;

    const [, user] = await Promise.all([
      db.notification.create({
        data: { userId: targetUserId, type, title: notifTitle, body, transactionId: txnId },
      }),
      db.user.findUnique({ where: { id: targetUserId }, select: { email: true, name: true } }),
    ]);

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: notifTitle,
        html: emailApprovalRequested(user.name, title, kind, note, txnId),
      });
    }
  } catch {
    // Best-effort
  }
}

// Notify the admin who requested approval that the party declined.
export async function notifyApprovalDeclined(
  adminUserId: string,
  type: "DISBURSEMENT_DECLINED" | "REFUND_DECLINED",
  title: string,
  declineNote: string,
  txnId: string
) {
  try {
    const kind = type === "DISBURSEMENT_DECLINED" ? "disbursement" : "refund";
    const notifTitle = "Approval request declined";
    const body = `The ${
      kind === "disbursement" ? "buyer" : "seller"
    } declined the ${kind} request on "${title}". Reason: ${declineNote}`;

    const [, user] = await Promise.all([
      db.notification.create({
        data: { userId: adminUserId, type, title: notifTitle, body, transactionId: txnId },
      }),
      db.user.findUnique({ where: { id: adminUserId }, select: { email: true, name: true } }),
    ]);

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: notifTitle,
        html: emailApprovalDeclined(user.name, title, kind, declineNote, txnId),
      });
    }
  } catch {
    // Best-effort
  }
}

// Notify parties (excluding the approver) that a refund has been issued.
export async function notifyTransactionRefunded(
  txnId: string,
  title: string,
  amount: string,
  excludeUserId?: string
) {
  try {
    const parties = await db.transactionParty.findMany({
      where: { transactionId: txnId },
      select: { userId: true, user: { select: { email: true, name: true } } },
    });

    const eligible = parties.filter((p) => p.userId !== excludeUserId);
    if (eligible.length === 0) return;

    await db.notification.createMany({
      data: eligible.map(({ userId }) => ({
        userId,
        type: "TRANSACTION_REFUNDED" as const,
        title: "Refund issued",
        body: `A refund has been issued for "${title}".`,
        transactionId: txnId,
      })),
    });

    await Promise.allSettled(
      eligible
        .filter((p) => p.user.email)
        .map((p) =>
          sendEmail({
            to: p.user.email!,
            subject: "Refund issued",
            html: emailTransactionRefunded(p.user.name, title, amount, txnId),
          })
        )
    );
  } catch {
    // Best-effort
  }
}

export async function notifyYouJoined(
  userId: string,
  title: string,
  amount: string,
  role: string,
  txnId: string
) {
  try {
    const [, user] = await Promise.all([
      db.notification.create({
        data: {
          userId,
          type: "TRANSACTION_CREATED",
          title: "You've joined a transaction",
          body: `You've joined "${title}" as the ${role.toLowerCase()}.`,
          transactionId: txnId,
        },
      }),
      db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
    ]);

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `You've joined "${title}"`,
        html: emailYouJoined(user.name, title, amount, role, txnId),
      });
    }
  } catch {
    // Best-effort
  }
}
