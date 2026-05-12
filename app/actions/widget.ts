"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, createSession } from "@/lib/session";
import { verifyInviteToken, formatAmount } from "@/lib/transaction/helpers";
import { notifyParties, notifyCounterpartyJoined, notifyYouJoined } from "@/lib/notifications";
import { dispatchWebhooks } from "@/lib/webhooks";
import { sendEmail, emailClaimAccount } from "@/lib/email";
import { randomBytes } from "crypto";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;
type Party = { role: string; userId: string; isInitiator: boolean };

import { z } from "zod";

const AcceptSchema = z.object({
  name: z.string().min(2, "Enter your full name.").trim(),
  email: z.string().email("Enter a valid email address.").trim().toLowerCase(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
});

// ─── Accept as guest (no session) — redirects back into the widget ───────────

export async function widgetAcceptAsGuest(
  txnId: string,
  token: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const tokenData = await verifyInviteToken(token);
  if (!tokenData || tokenData.txnId !== txnId) {
    return { message: "This invite link is invalid or has expired." };
  }

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: true },
  });

  if (!transaction) return { message: "Transaction not found." };
  if (transaction.status !== "CREATED") {
    return { message: "This transaction is no longer open for acceptance." };
  }

  const slotTaken = transaction.parties.some((p: Party) => p.role === tokenData.role);
  if (slotTaken) return { message: "This transaction has already been accepted." };

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: (formData.get("phone") as string) || undefined,
  };
  const validated = AcceptSchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors as Record<string, string[]> };

  const { name, email, phone } = validated.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser?.isClaimed) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/widget/${txnId}?token=${token}`)}`
    );
  }

  const counterparty =
    existingUser ??
    (await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        accountType: "PERSONAL",
        isClaimed: false,
        channel: "WIDGET",
      },
    }));

  if (existingUser && !existingUser.isClaimed) {
    await db.user.update({
      where: { id: existingUser.id },
      data: { name, phone: phone || existingUser.phone },
    });
  }

  await db.transactionParty.create({
    data: {
      transactionId: txnId,
      userId: counterparty.id,
      role: tokenData.role,
      isInitiator: false,
      accepted: true,
      acceptedAt: new Date(),
    },
  });

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "AWAITING_PAYMENT",
      statusLogs: {
        create: {
          fromStatus: "CREATED",
          toStatus: "AWAITING_PAYMENT",
          actorId: counterparty.id,
          note: `${tokenData.role} joined via widget`,
        },
      },
    },
  });

  const amountStr = formatAmount(transaction.amount);

  const initiator = transaction.parties.find((p: Party) => p.isInitiator);
  if (initiator) {
    await notifyCounterpartyJoined(initiator.userId, name, transaction.title, tokenData.role, txnId);
  }
  await notifyYouJoined(counterparty.id, transaction.title, amountStr, tokenData.role, txnId);

  if (!existingUser) {
    const claimToken = randomBytes(32).toString("hex");
    const claimTokenExp = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await db.user.update({
      where: { id: counterparty.id },
      data: { claimToken, claimTokenExp },
    });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://safepay.ng";
    await sendEmail({
      to: email,
      subject: "Secure your SafePay account",
      html: emailClaimAccount(name, `${base}/claim?token=${claimToken}`),
    });
  }

  await dispatchWebhooks(txnId, "transaction.created", {
    transaction: { id: txnId, title: transaction.title, status: "AWAITING_PAYMENT" },
  });

  await createSession({
    userId: counterparty.id,
    accountType: counterparty.accountType,
    name: counterparty.name,
  });

  redirect(`/widget/${txnId}?joined=1`);
}

// ─── Accept as logged-in user — redirects back into the widget ───────────────

export async function widgetAcceptAsLoggedIn(txnId: string, token: string): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/widget/${txnId}?token=${token}`)}`);
  }

  const tokenData = await verifyInviteToken(token);
  if (!tokenData || tokenData.txnId !== txnId) redirect(`/widget/${txnId}?error=invalid_token`);

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: true },
  });

  if (!transaction || transaction.status !== "CREATED") redirect(`/widget/${txnId}`);

  const td = tokenData!;
  const txn = transaction!;

  const slotTaken = txn.parties.some((p: Party) => p.role === td.role);
  if (slotTaken) redirect(`/widget/${txnId}`);

  const isInitiator = txn.parties.some((p: Party) => p.userId === session!.userId);
  if (isInitiator) redirect(`/widget/${txnId}?error=already_party`);

  await db.transactionParty.create({
    data: {
      transactionId: txnId,
      userId: session!.userId,
      role: td.role,
      isInitiator: false,
      accepted: true,
      acceptedAt: new Date(),
    },
  });

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "AWAITING_PAYMENT",
      statusLogs: {
        create: {
          fromStatus: "CREATED",
          toStatus: "AWAITING_PAYMENT",
          actorId: session!.userId,
          note: `${td.role} joined via widget`,
        },
      },
    },
  });

  const initiator = txn.parties.find((p: Party) => p.isInitiator);
  if (initiator) {
    await notifyCounterpartyJoined(initiator.userId, session!.name, txn.title, td.role, txnId);
  }
  await dispatchWebhooks(txnId, "transaction.created", {
    transaction: { id: txnId, title: txn.title, status: "AWAITING_PAYMENT" },
  });

  redirect(`/widget/${txnId}?joined=1`);
}

// ─── Mark delivered (seller) — redirects back into the widget ────────────────

export async function widgetMarkDelivered(txnId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: { where: { userId: session!.userId } } },
  });

  if (!transaction || transaction.parties.length === 0) redirect(`/widget/${txnId}`);

  const party = transaction!.parties[0];
  if (party.role !== "SELLER") redirect(`/widget/${txnId}?error=wrong_role`);

  const allowed = ["FUNDED", "IN_PROGRESS"];
  if (!allowed.includes(transaction!.status)) redirect(`/widget/${txnId}?error=wrong_status`);

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "DELIVERED",
      statusLogs: {
        create: {
          fromStatus: transaction!.status,
          toStatus: "DELIVERED",
          actorId: session!.userId,
          note: "Seller marked as delivered via widget",
        },
      },
    },
  });

  await notifyParties(
    txnId,
    "TRANSACTION_DELIVERED",
    "Item marked as delivered",
    `The seller has marked "${transaction!.title}" as delivered. Please review and confirm receipt.`,
    session!.userId
  );
  await dispatchWebhooks(txnId, "transaction.delivered", {
    transaction: { id: txnId, title: transaction!.title, status: "DELIVERED" },
  });

  redirect(`/widget/${txnId}`);
}

// ─── Confirm receipt (buyer) — redirects back into the widget ────────────────

export async function widgetConfirmReceipt(txnId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: { where: { userId: session!.userId } } },
  });

  if (!transaction || transaction.parties.length === 0) redirect(`/widget/${txnId}`);

  const party = transaction!.parties[0];
  if (party.role !== "BUYER") redirect(`/widget/${txnId}?error=wrong_role`);

  const allowed = ["DELIVERED", "UNDER_INSPECTION"];
  if (!allowed.includes(transaction!.status)) redirect(`/widget/${txnId}?error=wrong_status`);

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "COMPLETED",
      statusLogs: {
        create: {
          fromStatus: transaction!.status,
          toStatus: "COMPLETED",
          actorId: session!.userId,
          note: "Buyer confirmed receipt via widget",
        },
      },
    },
  });

  await notifyParties(
    txnId,
    "TRANSACTION_COMPLETED",
    "Transaction completed",
    `The buyer confirmed receipt of "${transaction!.title}". Payment will be released to you.`,
    session!.userId
  );
  await dispatchWebhooks(txnId, "transaction.completed", {
    transaction: { id: txnId, title: transaction!.title, status: "COMPLETED" },
  });

  redirect(`/widget/${txnId}`);
}
