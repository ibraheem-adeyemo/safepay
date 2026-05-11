"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, createSession } from "@/lib/session";
import {
  generateReference,
  verifyInviteToken,
  calculateFee,
} from "@/lib/transaction/helpers";
import { notifyUser, notifyParties } from "@/lib/notifications";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;
type Party = { role: string; userId: string; isInitiator: boolean };

// ─── Create Transaction ───────────────────────────────────────────────────────

const CreateSchema = z.object({
  title: z.string().min(2, "Describe what's being bought or sold.").trim(),
  description: z.string().max(500).optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount (numbers only).")
    .refine((v) => Number(v) >= 500, "Minimum transaction amount is ₦500."),
  role: z.enum(["BUYER", "SELLER"], { message: "Select your role in this deal." }),
});

export async function createTransaction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const raw = {
    title: formData.get("title"),
    description: (formData.get("description") as string) || undefined,
    amount: (formData.get("amount") as string)?.replace(/,/g, ""),
    role: formData.get("role"),
  };

  const validated = CreateSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const { title, description, amount, role } = validated.data;
  const amountNum = Number(amount);
  const fee = await calculateFee(amountNum, session.userId);

  const transaction = await db.transaction.create({
    data: {
      reference: generateReference(),
      title,
      description,
      amount: amountNum,
      currency: "NGN",
      status: "CREATED",
      channel: "WEB",
      feeType: fee.feeType,
      feeValue: fee.feeValue,
      feeAmount: fee.feeAmount,
      parties: {
        create: {
          userId: session.userId,
          role: role as "BUYER" | "SELLER",
          isInitiator: true,
          accepted: true,
          acceptedAt: new Date(),
        },
      },
      statusLogs: {
        create: {
          toStatus: "CREATED",
          actorId: session.userId,
          note: "Transaction created",
        },
      },
    },
  });

  await notifyUser(
    session.userId,
    "TRANSACTION_CREATED",
    "Transaction created",
    `Your escrow for "${title}" is ready. Share the invite link with the other party.`,
    transaction.id
  );

  redirect(`/dashboard/transactions/${transaction.id}`);
}

// ─── Accept Transaction — guest (no session) ─────────────────────────────────

const AcceptSchema = z.object({
  name: z.string().min(2, "Enter your full name.").trim(),
  email: z.string().email("Enter a valid email address.").trim().toLowerCase(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
});

export async function acceptTransactionAsGuest(
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
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  const { name, email, phone } = validated.data;

  // If the email belongs to a fully-claimed account, ask them to log in instead
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser?.isClaimed) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/t/${txnId}?token=${token}`)}`
    );
  }

  // Find-or-create the counterparty's shadow account
  const counterparty =
    existingUser ??
    (await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        accountType: "PERSONAL",
        isClaimed: false,
        channel: "WEB",
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
          note: `${tokenData.role} joined the transaction`,
        },
      },
    },
  });

  // Notify the initiator that their counterparty joined
  const initiator = transaction.parties.find((p: Party) => p.isInitiator);
  if (initiator) {
    await notifyUser(
      initiator.userId,
      "TRANSACTION_CREATED",
      "Your counterparty has joined",
      `${name} joined "${transaction.title}" as the ${tokenData.role.toLowerCase()}. The escrow is now active.`,
      txnId
    );
  }
  // Notify the new joiner
  await notifyUser(
    counterparty.id,
    "TRANSACTION_CREATED",
    "You've joined a transaction",
    `You've joined "${transaction.title}" as the ${tokenData.role.toLowerCase()}.`,
    txnId
  );

  // Give the counterparty a session — they're now "logged in" with a shadow account.
  // A banner on the transaction page will prompt them to set a password.
  await createSession({
    userId: counterparty.id,
    accountType: counterparty.accountType,
    name: counterparty.name,
  });

  redirect(`/t/${txnId}?joined=1`);
}

// ─── Accept Transaction — logged-in user ─────────────────────────────────────

export async function acceptTransactionAsLoggedIn(
  txnId: string,
  token: string
): Promise<void> {
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(`/t/${txnId}?token=${token}`)}`);

  const tokenData = await verifyInviteToken(token);
  if (!tokenData || tokenData.txnId !== txnId) redirect(`/t/${txnId}?error=invalid_token`);

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: true },
  });

  if (!transaction || transaction.status !== "CREATED") redirect(`/t/${txnId}`);

  // tokenData and transaction are non-null past this point (redirect throws above)
  const td = tokenData!;
  const txn = transaction!;

  const slotTaken = txn.parties.some((p: Party) => p.role === td.role);
  if (slotTaken) redirect(`/t/${txnId}`);

  const isInitiator = txn.parties.some((p: Party) => p.userId === session!.userId);
  if (isInitiator) redirect(`/t/${txnId}?error=already_party`);

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
          note: `${td.role} joined the transaction`,
        },
      },
    },
  });

  const initiator = txn.parties.find((p: Party) => p.isInitiator);
  if (initiator) {
    await notifyUser(
      initiator.userId,
      "TRANSACTION_CREATED",
      "Your counterparty has joined",
      `${session!.name} joined "${txn.title}" as the ${td.role.toLowerCase()}. The escrow is now active.`,
      txnId
    );
  }

  redirect(`/t/${txnId}?joined=1`);
}

// ─── Cancel Transaction ───────────────────────────────────────────────────────

export async function cancelTransaction(txnId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: { where: { userId: session.userId } } },
  });

  if (!transaction || transaction.parties.length === 0) {
    redirect(`/dashboard/transactions/${txnId}?error=not_found`);
  }

  const cancellableStatuses = ["CREATED", "AWAITING_PAYMENT"];
  if (!cancellableStatuses.includes(transaction.status)) {
    redirect(`/dashboard/transactions/${txnId}?error=cannot_cancel`);
  }

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "CANCELLED",
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "CANCELLED",
          actorId: session.userId,
          note: "Cancelled by party",
        },
      },
    },
  });

  await notifyParties(
    txnId,
    "TRANSACTION_CANCELLED",
    "Transaction cancelled",
    `"${transaction.title}" has been cancelled.`
  );

  redirect("/dashboard/transactions");
}

// ─── Mark as Delivered (seller) ──────────────────────────────────────────────

export async function markAsDelivered(txnId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: { where: { userId: session.userId } } },
  });

  if (!transaction || transaction.parties.length === 0) {
    redirect(`/dashboard/transactions/${txnId}?error=not_found`);
  }

  const party = transaction.parties[0];
  if (party.role !== "SELLER") {
    redirect(`/dashboard/transactions/${txnId}?error=wrong_role`);
  }

  const allowedStatuses = ["FUNDED", "IN_PROGRESS"];
  if (!allowedStatuses.includes(transaction.status)) {
    redirect(`/dashboard/transactions/${txnId}?error=wrong_status`);
  }

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "DELIVERED",
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "DELIVERED",
          actorId: session.userId,
          note: "Seller marked as delivered",
        },
      },
    },
  });

  // Notify the buyer (all parties except seller)
  await notifyParties(
    txnId,
    "TRANSACTION_DELIVERED",
    "Item marked as delivered",
    `The seller has marked "${transaction.title}" as delivered. Please review and confirm receipt.`,
    session.userId
  );

  redirect(`/dashboard/transactions/${txnId}`);
}

// ─── Confirm Receipt (buyer) ─────────────────────────────────────────────────

export async function confirmReceipt(txnId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: { where: { userId: session.userId } } },
  });

  if (!transaction || transaction.parties.length === 0) {
    redirect(`/dashboard/transactions/${txnId}?error=not_found`);
  }

  const party = transaction.parties[0];
  if (party.role !== "BUYER") {
    redirect(`/dashboard/transactions/${txnId}?error=wrong_role`);
  }

  const allowedStatuses = ["DELIVERED", "UNDER_INSPECTION"];
  if (!allowedStatuses.includes(transaction.status)) {
    redirect(`/dashboard/transactions/${txnId}?error=wrong_status`);
  }

  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "COMPLETED",
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "COMPLETED",
          actorId: session.userId,
          note: "Buyer confirmed receipt — payment will be released to seller",
        },
      },
    },
  });

  // Notify the seller (all parties except buyer)
  await notifyParties(
    txnId,
    "TRANSACTION_COMPLETED",
    "Transaction completed",
    `The buyer confirmed receipt of "${transaction.title}". Payment will be released to you.`,
    session.userId
  );

  redirect(`/dashboard/transactions/${txnId}`);
}

// ─── Raise Dispute ────────────────────────────────────────────────────────────

const DisputeSchema = z.object({
  reason: z.string().min(10, "Provide a clear reason (at least 10 characters).").trim(),
  description: z.string().max(1000).optional(),
});

export async function raiseDispute(
  txnId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const disputeable = ["FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION"];

  const transaction = await db.transaction.findUnique({
    where: { id: txnId },
    include: { parties: { where: { userId: session.userId } } },
  });

  if (!transaction || transaction.parties.length === 0) {
    return { message: "Transaction not found." };
  }
  if (!disputeable.includes(transaction.status)) {
    return { message: "You cannot raise a dispute at this stage of the transaction." };
  }

  const raw = {
    reason: formData.get("reason"),
    description: (formData.get("description") as string) || undefined,
  };

  const validated = DisputeSchema.safeParse(raw);
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors };

  const { reason, description } = validated.data;

  await db.dispute.create({
    data: {
      transactionId: txnId,
      raisedById: session.userId,
      reason,
      description: description ?? null,
      status: "OPEN",
    },
  });
  await db.transaction.update({
    where: { id: txnId },
    data: {
      status: "DISPUTED",
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "DISPUTED",
          actorId: session.userId,
          note: `Dispute raised: ${reason}`,
        },
      },
    },
  });

  await notifyParties(
    txnId,
    "DISPUTE_RAISED",
    "Dispute raised",
    `A dispute has been raised on "${transaction.title}". Our team will review and reach out to both parties.`
  );

  redirect(`/dashboard/transactions/${txnId}`);
}
