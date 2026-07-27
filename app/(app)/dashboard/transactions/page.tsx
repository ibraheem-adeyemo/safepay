import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { StatusBadge } from "@/src/features/components/StatusBadge";
import { formatAmount } from "@/lib/transaction/helpers";
import type { TransactionStatus } from "@prisma/client";

const FILTERS: { label: string; statuses: TransactionStatus[] | "all" }[] = [
  { label: "All", statuses: "all" },
  {
    label: "Active",
    statuses: [
      "CREATED", "AWAITING_PAYMENT", "FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION",
      "RECEIPT_CONFIRMED", "PENDING_DISBURSEMENT_APPROVAL", "PENDING_REFUND_APPROVAL",
    ],
  },
  { label: "Completed", statuses: ["COMPLETED"] },
  { label: "Cancelled", statuses: ["CANCELLED", "REFUNDED"] },
  { label: "Disputed", statuses: ["DISPUTED"] },
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();
  const { filter = "all" } = await searchParams;

  const activeFilter = FILTERS.find((f) => f.label.toLowerCase() === filter) ?? FILTERS[0];

  const parties = await db.transactionParty.findMany({
    where: {
      userId: session!.userId,
      ...(activeFilter.statuses !== "all"
        ? { transaction: { status: { in: activeFilter.statuses } } }
        : {}),
    },
    include: { transaction: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-800">Transactions</h1>
        <Link
          href="/dashboard/transactions/new"
          className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-100 whitespace-nowrap"
        >
          + New
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = (activeFilter.label === f.label);
          return (
            <Link
              key={f.label}
              href={`/dashboard/transactions?filter=${f.label.toLowerCase()}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                active
                  ? "bg-stone-800 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {parties.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-bold text-stone-800 mb-1">No transactions found</p>
            <p className="text-stone-400 text-sm">
              {filter === "all"
                ? "Create your first protected transaction to get started."
                : `No ${filter} transactions yet.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {parties.map((party) => {
              const txn = party.transaction;
              return (
                <Link
                  key={txn.id}
                  href={`/dashboard/transactions/${txn.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="min-w-0 mr-4">
                    <p className="font-semibold text-stone-800 text-sm truncate">{txn.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {txn.reference} · {party.role} ·{" "}
                      {new Date(txn.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-stone-800 text-sm">₦{formatAmount(txn.amount)}</p>
                    <div className="mt-1">
                      <StatusBadge status={txn.status} />
                    </div>
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
