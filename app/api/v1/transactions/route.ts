import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";
import { generateReference, calculateFee } from "@/lib/transaction/helpers";
import { dispatchWebhooks } from "@/lib/webhooks";
import { notifyUser } from "@/lib/notifications";

const VALID_STATUSES = [
  "CREATED", "AWAITING_PAYMENT", "FUNDED", "IN_PROGRESS",
  "DELIVERED", "UNDER_INSPECTION", "COMPLETED", "DISPUTED",
  "REFUNDED", "CANCELLED",
];

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

  const where = {
    parties: { some: { userId: auth.userId } },
    ...(status ? { status: status as never } : {}),
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

const CreateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters.").max(200).trim(),
  description: z.string().max(500).optional(),
  amount: z.number().min(500, "Minimum amount is ₦500."),
  role: z.enum(["BUYER", "SELLER"]),
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

  const validated = CreateSchema.safeParse(body);
  if (!validated.success) {
    return Response.json(
      { error: "Validation failed", details: z.flattenError(validated.error).fieldErrors },
      { status: 422 }
    );
  }

  const { title, description, amount, role } = validated.data;
  const fee = await calculateFee(amount, auth.userId);

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
          userId: auth.userId,
          role: role as "BUYER" | "SELLER",
          isInitiator: true,
          accepted: true,
          acceptedAt: new Date(),
        },
      },
      statusLogs: {
        create: {
          toStatus: "CREATED",
          actorId: auth.userId,
          note: "Transaction created via API",
        },
      },
    },
    include: {
      parties: { select: { role: true, userId: true, isInitiator: true } },
    },
  });

  await notifyUser(
    auth.userId,
    "TRANSACTION_CREATED",
    "Transaction created",
    `Your escrow for "${title}" is ready. Share the invite link with the other party.`,
    transaction.id
  );
  await dispatchWebhooks(transaction.id, "transaction.created", {
    transaction: {
      id: transaction.id,
      reference: transaction.reference,
      title,
      amount,
      status: "CREATED",
    },
  });

  return Response.json({ data: transaction }, { status: 201 });
}
