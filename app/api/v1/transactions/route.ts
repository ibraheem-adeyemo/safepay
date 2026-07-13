import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";
import { generateReference, calculateFee } from "@/lib/transaction/helpers";
import { dispatchWebhooks } from "@/lib/webhooks";
import { notifyUser } from "@/lib/notifications";
import { sendEmail, emailClaimAccount } from "@/lib/email";
import { hashToken } from "@/lib/token";

const VALID_STATUSES = [
  "CREATED", "AWAITING_PAYMENT", "FUNDED", "IN_PROGRESS",
  "DELIVERED", "UNDER_INSPECTION", "COMPLETED", "DISPUTED",
  "REFUNDED", "CANCELLED",
];

// ─── GET /api/v1/transactions ─────────────────────────────────────────────────

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  if (status && !VALID_STATUSES.includes(status)) {
    return Response.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const statusFilter = status ? { status: status as never } : {};

  // Return transactions where this account is either a party OR the platform orchestrator
  const where = {
    OR: [
      { parties: { some: { userId: auth.userId } } },
      { platformId: auth.userId },
    ],
    ...statusFilter,
  };

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        parties: { select: { role: true, userId: true, isInitiator: true } },
      },
    }),
    db.transaction.count({ where }),
  ]);

  return Response.json({ data: transactions, meta: { total, limit, offset } });
}

// ─── POST /api/v1/transactions ────────────────────────────────────────────────

// Direct mode: the API key holder is one of the parties (current behaviour)
const DirectSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  description: z.string().max(500).optional(),
  amount: z.number().min(500, "Minimum amount is ₦500."),
  role: z.enum(["BUYER", "SELLER"]),
});

// Marketplace mode: the API key holder is the platform; both parties supplied upfront
const PartySchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/).optional().or(z.literal("")),
});

const MarketplaceSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  description: z.string().max(500).optional(),
  amount: z.number().min(500, "Minimum amount is ₦500."),
  seller: PartySchema,
  buyer: PartySchema,
});

export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Detect mode: marketplace when both `seller` and `buyer` are present
  const isMarketplace =
    body !== null &&
    typeof body === "object" &&
    "seller" in body &&
    "buyer" in body;

  if (isMarketplace) {
    return handleMarketplace(body, auth.userId);
  }
  return handleDirect(body, auth.userId);
}

// ─── Direct mode ──────────────────────────────────────────────────────────────

async function handleDirect(body: unknown, userId: string) {
  const validated = DirectSchema.safeParse(body);
  if (!validated.success) {
    return Response.json(
      { error: "Validation failed", details: z.flattenError(validated.error).fieldErrors },
      { status: 422 }
    );
  }

  const { title, description, amount, role } = validated.data;
  const fee = await calculateFee(amount, userId);

  const transaction = await db.transaction.create({
    data: {
      reference: generateReference(),
      title,
      description,
      amount,
      currency: "NGN",
      status: "CREATED",
      channel: "API",
      feeType: fee.feeType,
      feeValue: fee.feeValue,
      feeAmount: fee.feeAmount,
      parties: {
        create: {
          userId,
          role: role as "BUYER" | "SELLER",
          isInitiator: true,
          accepted: true,
          acceptedAt: new Date(),
        },
      },
      statusLogs: {
        create: { toStatus: "CREATED", actorId: userId, note: "Transaction created via API" },
      },
    },
    include: {
      parties: { select: { role: true, userId: true, isInitiator: true } },
    },
  });

  await notifyUser(
    userId,
    "TRANSACTION_CREATED",
    "Transaction created",
    `Your escrow for "${title}" is ready. Share the invite link with the other party.`,
    transaction.id
  );
  await dispatchWebhooks(transaction.id, "transaction.created", {
    transaction: { id: transaction.id, reference: transaction.reference, title, amount, status: "CREATED" },
  });

  return Response.json({ data: transaction }, { status: 201 });
}

// ─── Marketplace mode ─────────────────────────────────────────────────────────

async function handleMarketplace(body: unknown, platformUserId: string) {
  const validated = MarketplaceSchema.safeParse(body);
  if (!validated.success) {
    return Response.json(
      { error: "Validation failed", details: z.flattenError(validated.error).fieldErrors },
      { status: 422 }
    );
  }

  const { title, description, amount, seller, buyer } = validated.data;

  if (seller.email === buyer.email) {
    return Response.json({ error: "Seller and buyer cannot be the same person." }, { status: 422 });
  }

  const fee = await calculateFee(amount, platformUserId);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://vaultlify.com";

  // Find-or-create shadow accounts for both parties in parallel
  const [sellerUser, buyerUser] = await Promise.all([
    findOrCreateShadowUser(seller.name, seller.email, seller.phone),
    findOrCreateShadowUser(buyer.name, buyer.email, buyer.phone),
  ]);

  const transaction = await db.transaction.create({
    data: {
      reference: generateReference(),
      title,
      description,
      amount,
      currency: "NGN",
      // Both parties already exist — move straight to awaiting payment
      status: "AWAITING_PAYMENT",
      channel: "API",
      feeType: fee.feeType,
      feeValue: fee.feeValue,
      feeAmount: fee.feeAmount,
      platformId: platformUserId,
      parties: {
        create: [
          {
            userId: sellerUser.id,
            role: "SELLER",
            isInitiator: true,
            accepted: true,
            acceptedAt: new Date(),
          },
          {
            userId: buyerUser.id,
            role: "BUYER",
            isInitiator: false,
            accepted: true,
            acceptedAt: new Date(),
          },
        ],
      },
      statusLogs: {
        create: {
          toStatus: "AWAITING_PAYMENT",
          actorId: platformUserId,
          note: "Marketplace transaction created via API — both parties pre-registered",
        },
      },
    },
    include: {
      parties: { select: { role: true, userId: true, isInitiator: true } },
    },
  });

  // Email claim links to any brand-new shadow accounts (non-blocking)
  void sendClaimEmailIfNew(sellerUser, seller.email, base);
  void sendClaimEmailIfNew(buyerUser, buyer.email, base);

  await dispatchWebhooks(transaction.id, "transaction.created", {
    transaction: {
      id: transaction.id,
      reference: transaction.reference,
      title,
      amount,
      status: "AWAITING_PAYMENT",
    },
  });

  const widgetBase = `${base}/widget/${transaction.id}`;

  return Response.json(
    {
      data: {
        ...transaction,
        // Convenience URLs the platform can embed directly — no invite token needed
        // since both parties are already registered on the transaction
        sellerWidgetUrl: widgetBase,
        buyerWidgetUrl: widgetBase,
      },
    },
    { status: 201 }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findOrCreateShadowUser(
  name: string,
  email: string,
  phone?: string
): Promise<{ id: string; accountType: string; name: string; isNew: boolean }> {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isClaimed) {
      await db.user.update({
        where: { id: existing.id },
        data: { name, phone: phone || existing.phone },
      });
    }
    return { ...existing, isNew: false };
  }

  try {
    const created = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        accountType: "PERSONAL",
        isClaimed: false,
        channel: "API",
      },
    });
    return { ...created, isNew: true };
  } catch {
    // Another concurrent request created this user between our findUnique and create.
    // Fetch the now-existing record and treat it as an existing user.
    const raceWinner = await db.user.findUnique({ where: { email } });
    if (!raceWinner) throw new Error(`Failed to find or create user for ${email}`);
    return { ...raceWinner, isNew: false };
  }
}

async function sendClaimEmailIfNew(
  user: { id: string; isNew: boolean },
  email: string,
  base: string
): Promise<void> {
  if (!user.isNew) return;
  try {
    const claimToken = randomBytes(32).toString("hex");
    const claimTokenExp = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await db.user.update({
      where: { id: user.id },
      data: { claimToken: hashToken(claimToken), claimTokenExp },
    });
    const userName = await db.user.findUnique({ where: { id: user.id }, select: { name: true } });
    await sendEmail({
      to: email,
      subject: "You have been added to a Vaultlify escrow",
      html: emailClaimAccount(userName?.name ?? "there", `${base}/claim?token=${claimToken}`),
    });
  } catch {
    // Best-effort — claim email failure must not break the API response
  }
}
