import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatAmount } from "@/lib/transaction/helpers";

export default async function AdminPage() {
  const session = await getSession();

  const [totalTxns, activeEscrows, pendingPayments, openDisputes, totalUsers, volumeResult] =
    await Promise.all([
      db.transaction.count(),
      db.transaction.count({
        where: { status: { in: ["FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION"] } },
      }),
      db.transaction.count({ where: { status: "AWAITING_PAYMENT" } }),
      db.transaction.count({ where: { status: "DISPUTED" } }),
      db.user.count(),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),
    ]);

  const [pendingList, disputeList] = await Promise.all([
    db.transaction.findMany({
      where: { status: "AWAITING_PAYMENT" },
      include: { parties: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    db.transaction.findMany({
      where: { status: "DISPUTED" },
      include: {
        parties: { include: { user: true } },
        disputes: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const totalVolume = Number(volumeResult._sum.amount ?? 0);

  const stats = [
    { label: "Total Transactions", value: totalTxns.toLocaleString(), icon: "📋", sub: "all time" },
    { label: "Active Escrows", value: activeEscrows.toLocaleString(), icon: "🔒", sub: "funded / in progress" },
    { label: "Pending Payments", value: pendingPayments.toLocaleString(), icon: "⏳", sub: "awaiting confirmation" },
    { label: "Open Disputes", value: openDisputes.toLocaleString(), icon: "⚠️", sub: "need attention", alert: openDisputes > 0 },
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: "👥", sub: "all accounts" },
    { label: "Volume Released", value: `₦${formatAmount(totalVolume)}`, icon: "💰", sub: "completed transactions" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Operations Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">
          Signed in as <span className="font-semibold">{session?.name}</span> · {session?.accountType}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-2xl border p-5 ${
              s.alert ? "border-red-200 bg-red-50" : "border-stone-200"
            }`}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className={`text-2xl font-bold ${s.alert ? "text-red-700" : "text-stone-900"}`}>
              {s.value}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending payment verification */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-stone-900">Pending Payment Verification</h2>
              <p className="text-stone-400 text-xs mt-0.5">Manually confirm bank transfers</p>
            </div>
            {pendingPayments > 0 && (
              <Link
                href="/admin/transactions?status=AWAITING_PAYMENT"
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                View all →
              </Link>
            )}
          </div>

          {pendingList.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm">No pending verifications</div>
          ) : (
            <div className="space-y-3">
              {pendingList.map((txn) => {
                const buyer = txn.parties.find((p) => p.role === "BUYER");
                const seller = txn.parties.find((p) => p.role === "SELLER");
                return (
                  <Link
                    key={txn.id}
                    href={`/admin/transactions/${txn.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{txn.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {buyer?.user.name ?? "—"} → {seller?.user.name ?? "Awaiting"}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-stone-800">₦{formatAmount(txn.amount)}</p>
                      <p className="text-xs text-emerald-600 font-semibold group-hover:underline">
                        Review →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Open disputes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-stone-900">Open Disputes</h2>
              <p className="text-stone-400 text-xs mt-0.5">Require admin resolution</p>
            </div>
            {openDisputes > 0 && (
              <Link
                href="/admin/disputes"
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                View all →
              </Link>
            )}
          </div>

          {disputeList.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm">No open disputes</div>
          ) : (
            <div className="space-y-3">
              {disputeList.map((txn) => {
                const dispute = txn.disputes[0];
                return (
                  <Link
                    key={txn.id}
                    href={`/admin/transactions/${txn.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50 hover:border-red-300 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{txn.title}</p>
                      {dispute && (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">{dispute.reason}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-stone-800">₦{formatAmount(txn.amount)}</p>
                      <p className="text-xs text-red-600 font-semibold group-hover:underline">
                        Resolve →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
