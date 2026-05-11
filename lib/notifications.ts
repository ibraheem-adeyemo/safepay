import { db } from "@/lib/db";

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

export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  transactionId?: string
) {
  try {
    await db.notification.create({
      data: { userId, type, title, body, transactionId: transactionId ?? null },
    });
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
      select: { userId: true },
    });

    const userIds = parties
      .map((p) => p.userId)
      .filter((id) => id !== excludeUserId);

    if (userIds.length === 0) return;

    await db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        transactionId: txnId,
      })),
    });
  } catch {
    // Best-effort
  }
}
