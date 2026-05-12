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
  if (party.role !== "BUYER") {
    return Response.json(
      { error: "Only the buyer can confirm receipt" },
      { status: 403 }
    );
  }

  const allowed = ["DELIVERED", "UNDER_INSPECTION"];
  if (!allowed.includes(transaction.status)) {
    return Response.json(
      { error: `Cannot confirm receipt from ${transaction.status} status` },
      { status: 409 }
    );
  }

  const updated = await db.transaction.update({
    where: { id },
    data: {
      status: "COMPLETED",
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "COMPLETED",
          actorId: auth.userId,
          note: "Buyer confirmed receipt via API",
        },
      },
    },
  });

  await notifyParties(
    id,
    "TRANSACTION_COMPLETED",
    "Transaction completed",
    `The buyer confirmed receipt of "${transaction.title}". Payment will be released to you.`,
    auth.userId
  );
  await dispatchWebhooks(id, "transaction.completed", {
    transaction: { id, reference: transaction.reference, title: transaction.title, status: "COMPLETED" },
  });

  return Response.json({ data: updated });
}
