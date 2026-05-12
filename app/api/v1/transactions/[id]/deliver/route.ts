import { db } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";
import { notifyParties } from "@/lib/notifications";
import { dispatchWebhooks } from "@/lib/webhooks";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: { parties: { where: { userId: auth.userId } } },
  });

  if (!transaction || transaction.parties.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const party = transaction.parties[0];
  if (party.role !== "SELLER") {
    return Response.json(
      { error: "Only the seller can mark a transaction as delivered" },
      { status: 403 }
    );
  }

  const allowed = ["FUNDED", "IN_PROGRESS"];
  if (!allowed.includes(transaction.status)) {
    return Response.json(
      { error: `Cannot mark as delivered from ${transaction.status} status` },
      { status: 409 }
    );
  }

  const updated = await db.transaction.update({
    where: { id },
    data: {
      status: "DELIVERED",
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "DELIVERED",
          actorId: auth.userId,
          note: "Seller marked as delivered via API",
        },
      },
    },
  });

  await notifyParties(
    id,
    "TRANSACTION_DELIVERED",
    "Item marked as delivered",
    `The seller has marked "${transaction.title}" as delivered. Please review and confirm receipt.`,
    auth.userId
  );
  await dispatchWebhooks(id, "transaction.delivered", {
    transaction: { id, reference: transaction.reference, title: transaction.title, status: "DELIVERED" },
  });

  return Response.json({ data: updated });
}
