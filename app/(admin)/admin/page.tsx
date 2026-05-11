import { getSession } from "@/lib/session";

export default async function AdminPage() {
  const session = await getSession();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
        <p className="text-stone-400 text-sm mt-1">
          Signed in as {session?.name} · {session?.accountType}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Transactions", value: "0", icon: "📋", sub: "all time" },
          { label: "Active Escrows", value: "0", icon: "🔒", sub: "in progress" },
          { label: "Pending Payments", value: "0", icon: "⏳", sub: "await confirmation" },
          { label: "Open Disputes", value: "0", icon: "⚠️", sub: "need attention" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-stone-800 rounded-2xl border border-stone-700 p-5"
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
            <p className="text-xs text-stone-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Action queues */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending payment verification */}
        <div className="bg-stone-800 rounded-2xl border border-stone-700 p-6">
          <h2 className="text-white font-bold mb-1">Pending Payment Verification</h2>
          <p className="text-stone-400 text-xs mb-4">
            Transactions waiting for manual payment confirmation
          </p>
          <div className="text-center py-8 text-stone-600 text-sm">
            No pending verifications
          </div>
        </div>

        {/* Open disputes */}
        <div className="bg-stone-800 rounded-2xl border border-stone-700 p-6">
          <h2 className="text-white font-bold mb-1">Open Disputes</h2>
          <p className="text-stone-400 text-xs mb-4">
            Disputes raised by buyers or sellers
          </p>
          <div className="text-center py-8 text-stone-600 text-sm">
            No open disputes
          </div>
        </div>
      </div>
    </div>
  );
}
