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

  const cancellable = ["CREATED", "AWAITING_PAYMENT"];
  if (!cancellable.includes(transaction.status)) {
    return Response.json(
      { error: `Cannot cancel a transaction in ${transaction.status} status` },
      { status: 409 }
    );
  }

  const updated = await db.transaction.update({
    where: { id },
    data: {
      status: "CANCELLED",
      statusLogs: {
        create: {
          fromStatus: transaction.status,
          toStatus: "CANCELLED",
          actorId: auth.userId,
          note: "Cancelled via API",
        },
      },
    },
  });

  await notifyParties(
    id,
    "TRANSACTION_CANCELLED",
    "Transaction cancelled",
    `"${transaction.title}" has been cancelled.`
  );
  await dispatchWebhooks(id, "transaction.cancelled", {
    transaction: { id, reference: transaction.reference, title: transaction.title, status: "CANCELLED" },
  });

  return Response.json({ data: updated });
}
