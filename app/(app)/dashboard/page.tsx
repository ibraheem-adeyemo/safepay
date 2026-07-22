import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { StatusBadge } from "@/src/features/components/StatusBadge";
import { formatAmount } from "@/lib/transaction/helpers";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [active, completed, disputed, recent] = await Promise.all([
    db.transactionParty.count({
      where: {
        userId: session.userId,
        transaction: {
          status: {
            in: ["CREATED", "AWAITING_PAYMENT", "FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION"],
          },
        },
      },
    }),
    db.transactionParty.count({
      where: { userId: session.userId, transaction: { status: "COMPLETED" } },
    }),
    db.transactionParty.count({
      where: { userId: session.userId, transaction: { status: "DISPUTED" } },
    }),
    db.transactionParty.findMany({
      where: { userId: session.userId },
      include: { transaction: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  type RecentParty = (typeof recent)[number];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            Welcome back, {session?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage your protected transactions.
          </p>
        </div>
        <Link
          href="/dashboard/transactions/new"
          className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-100 whitespace-nowrap hidden sm:block"
        >
          + New Transaction
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active", value: active, icon: "🔒" },
          { label: "Completed", value: completed, icon: "✅" },
          { label: "Disputed", value: disputed, icon: "⚠️" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-stone-800">{s.value}</p>
            <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-bold text-stone-800">Recent Transactions</h2>
          <Link
            href="/dashboard/transactions"
            className="text-xs text-emerald-700 font-semibold hover:underline"
          >
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="font-bold text-stone-800 mb-2">No transactions yet</h3>
            <p className="text-stone-500 text-sm mb-6 max-w-xs mx-auto">
              Create a protected escrow transaction and share the link with your
              buyer or seller.
            </p>
            <Link
              href="/dashboard/transactions/new"
              className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-100 inline-block"
            >
              Create First Transaction →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recent.map((party: RecentParty) => (
              <Link
                key={party.transaction.id}
                href={`/dashboard/transactions/${party.transaction.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors"
              >
                <div className="min-w-0 mr-4">
                  <p className="font-semibold text-stone-800 text-sm truncate">
                    {party.transaction.title}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {party.transaction.reference} · {party.role}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-stone-800 text-sm">
                    ₦{formatAmount(party.transaction.amount)}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={party.transaction.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile CTA */}
      <div className="mt-6 sm:hidden">
        <Link
          href="/dashboard/transactions/new"
          className="block w-full bg-emerald-700 text-white font-bold py-4 rounded-xl text-center text-sm"
        >
          + New Transaction
        </Link>
      </div>
    </div>
  );
}
