import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Mark all as read when page is visited
  await db.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });

  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const TYPE_ICONS: Record<string, string> = {
    TRANSACTION_CREATED: "📋",
    TRANSACTION_FUNDED: "✅",
    TRANSACTION_DELIVERED: "📦",
    TRANSACTION_COMPLETED: "🎉",
    TRANSACTION_DISPUTED: "⚠️",
    TRANSACTION_CANCELLED: "❌",
    PAYMENT_CONFIRMED: "💰",
    DISPUTE_RAISED: "🚨",
    DISPUTE_RESOLVED: "✅",
    ACCOUNT_CLAIMED: "🔐",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Notifications</h1>
        <p className="text-xs text-stone-400">Notifications are marked read on visit.</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm">
            <p className="text-3xl mb-3">🔔</p>
            <p>No notifications yet</p>
            <p className="text-xs mt-1">Transaction updates will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {notifications.map((n: (typeof notifications)[number]) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 ${!n.isRead ? "bg-emerald-50/40" : ""}`}
              >
                <div className="text-xl shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type] ?? "🔔"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800">{n.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-stone-300 mt-1">
                    {new Date(n.createdAt).toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {n.transactionId && (
                  <Link
                    href={`/dashboard/transactions/${n.transactionId}`}
                    className="text-xs text-emerald-700 font-semibold hover:underline shrink-0"
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
