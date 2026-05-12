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
  | "ACCOUNT_CLAIMED";

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
        subject: "Your SafePay escrow is ready",
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
