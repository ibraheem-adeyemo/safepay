import Link from "next/link";
import { db } from "@/lib/db";
import { StatusBadge } from "@/src/features/components/StatusBadge";
import { formatAmount } from "@/lib/transaction/helpers";
import type { TransactionStatus } from "@prisma/client";

const ALL_STATUSES: TransactionStatus[] = [
  "CREATED",
  "AWAITING_PAYMENT",
  "FUNDED",
  "IN_PROGRESS",
  "DELIVERED",
  "UNDER_INSPECTION",
  "COMPLETED",
  "DISPUTED",
  "REFUNDED",
  "CANCELLED",
];

const TAB_LABELS: Partial<Record<TransactionStatus | "ALL", string>> = {
  ALL: "All",
  AWAITING_PAYMENT: "Pending Payment",
  DISPUTED: "Disputed",
  FUNDED: "Funded",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter =
    status && ALL_STATUSES.includes(status as TransactionStatus)
      ? (status as TransactionStatus)
      : null;

  const transactions = await db.transaction.findMany({
    where: activeFilter ? { status: activeFilter } : undefined,
    include: { parties: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tabs = ["ALL", "AWAITING_PAYMENT", "DISPUTED", "FUNDED", "COMPLETED", "CANCELLED"] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Transactions</h1>
          <p className="text-stone-500 text-sm mt-1">{transactions.length} result{transactions.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map((tab) => {
          const isActive = tab === "ALL" ? !activeFilter : activeFilter === tab;
          const href = tab === "ALL" ? "/admin/transactions" : `/admin/transactions?status=${tab}`;
          return (
            <Link
              key={tab}
              href={href}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? "bg-emerald-700 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {TAB_LABELS[tab] ?? tab}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm">No transactions found</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {transactions.map((txn) => {
              const buyer = txn.parties.find((p) => p.role === "BUYER");
              const seller = txn.parties.find((p) => p.role === "SELLER");
              return (
                <Link
                  key={txn.id}
                  href={`/admin/transactions/${txn.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs text-stone-400 font-mono">{txn.reference}</p>
                    </div>
                    <p className="text-sm font-semibold text-stone-800 truncate">{txn.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {buyer?.user.name ?? "—"} (B) → {seller?.user.name ?? "Awaiting"} (S)
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-stone-900">₦{formatAmount(txn.amount)}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(txn.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={txn.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
