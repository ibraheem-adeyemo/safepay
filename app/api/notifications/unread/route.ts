import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ count: 0 }, { status: 401 });

  const count = await db.notification.count({
    where: { userId: session.userId, isRead: false },
  });

  return Response.json({ count });
}
