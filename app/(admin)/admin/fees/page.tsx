import { db } from "@/lib/db";
import FeeConfigForm from "./FeeConfigForm";

export default async function AdminFeesPage() {
  const config = await db.feeConfig.findFirst({ where: { businessId: null } });

  const businessConfigs = await db.feeConfig.findMany({
    where: { businessId: { not: null } },
    include: { business: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Fee Configuration</h1>
        <p className="text-stone-500 text-sm mt-1">
          Set the global platform fee applied to all transactions.
        </p>
      </div>

      {/* Current config summary */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-6">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">
          Current Global Fee
        </p>
        {config ? (
          <p className="text-2xl font-black text-emerald-900">
            {config.isFree
              ? "Free (0%)"
              : config.feeType === "PERCENTAGE"
              ? `${Number(config.feeValue)}%`
              : `₦${Number(config.feeValue).toLocaleString()} fixed`}
          </p>
        ) : (
          <p className="text-stone-500 text-sm">No fee configured yet</p>
        )}
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6 mb-6">
        <h2 className="text-base font-bold text-stone-900 mb-4">Update Global Fee</h2>
        <FeeConfigForm
          currentType={config?.feeType ?? "PERCENTAGE"}
          currentValue={Number(config?.feeValue ?? 1.5)}
        />
      </div>

      {/* Business overrides */}
      {businessConfigs.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6">
          <h2 className="text-base font-bold text-stone-900 mb-1">Business Overrides</h2>
          <p className="text-stone-400 text-xs mb-4">
            These businesses have custom fee rates that override the global default.
          </p>
          <div className="divide-y divide-stone-100">
            {businessConfigs.map((bc) => (
              <div key={bc.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{bc.business?.name}</p>
                  <p className="text-xs text-stone-400">{bc.business?.user.email}</p>
                </div>
                <span className="text-sm font-bold text-emerald-700">
                  {bc.isFree
                    ? "Free"
                    : bc.feeType === "PERCENTAGE"
                    ? `${Number(bc.feeValue)}%`
                    : `₦${Number(bc.feeValue).toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
