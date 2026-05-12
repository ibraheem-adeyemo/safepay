import { db } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      parties: { select: { role: true, userId: true, isInitiator: true } },
      statusLogs: { orderBy: { createdAt: "asc" }, select: { fromStatus: true, toStatus: true, note: true, createdAt: true } },
    },
  });

  if (!transaction) return Response.json({ error: "Not found" }, { status: 404 });

  const isParty = transaction.parties.some(
    (p: { userId: string }) => p.userId === auth.userId
  );
  if (!isParty) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ data: transaction });
}
