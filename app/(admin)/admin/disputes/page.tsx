import Link from "next/link";
import { db } from "@/lib/db";
import { formatAmount } from "@/lib/transaction/helpers";
import type { DisputeStatus } from "@prisma/client";

const STATUS_TABS: { value: DisputeStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const DISPUTE_STATUS_STYLES: Record<DisputeStatus, string> = {
  OPEN: "bg-red-100 text-red-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-stone-100 text-stone-500",
};

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatuses: DisputeStatus[] = ["OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"];
  const activeFilter =
    status && validStatuses.includes(status as DisputeStatus)
      ? (status as DisputeStatus)
      : null;

  const disputes = await db.dispute.findMany({
    where: activeFilter ? { status: activeFilter } : undefined,
    include: {
      transaction: {
        include: { parties: { include: { user: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Disputes</h1>
        <p className="text-stone-500 text-sm mt-1">
          {disputes.length} result{disputes.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_TABS.map(({ value, label }) => {
          const isActive = value === "ALL" ? !activeFilter : activeFilter === value;
          const href = value === "ALL" ? "/admin/disputes" : `/admin/disputes?status=${value}`;
          return (
            <Link
              key={value}
              href={href}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? "bg-emerald-700 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {disputes.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm">No disputes found</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {disputes.map((dispute) => {
              const txn = dispute.transaction;
              const buyer = txn.parties.find((p) => p.role === "BUYER");
              const seller = txn.parties.find((p) => p.role === "SELLER");
              return (
                <Link
                  key={dispute.id}
                  href={`/admin/transactions/${txn.id}`}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${DISPUTE_STATUS_STYLES[dispute.status]}`}
                      >
                        {dispute.status.replace("_", " ")}
                      </span>
                      <p className="text-xs text-stone-400 font-mono">{txn.reference}</p>
                    </div>
                    <p className="text-sm font-semibold text-stone-800">{dispute.reason}</p>
                    {dispute.description && (
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
                        {dispute.description}
                      </p>
                    )}
                    <p className="text-xs text-stone-400 mt-1.5">
                      {txn.title} · {buyer?.user.name ?? "—"} vs {seller?.user.name ?? "—"}
                    </p>
                    {dispute.resolution && (
                      <p className="text-xs text-emerald-600 mt-1 font-semibold">
                        Resolution: {dispute.resolution}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-stone-900">
                      ₦{formatAmount(txn.amount)}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(dispute.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">View →</p>
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
