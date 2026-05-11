import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">
          Welcome back, {session?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Here&apos;s an overview of your escrow activity.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Escrows", value: "0", icon: "🔒", color: "emerald" },
          { label: "In Escrow (₦)", value: "0.00", icon: "💰", color: "amber" },
          { label: "Completed", value: "0", icon: "✅", color: "blue" },
          { label: "Disputes", value: "0", icon: "⚠️", color: "red" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-stone-200 p-5"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
            <p className="text-xs text-stone-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Empty state — transactions */}
      <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
        <div className="text-4xl mb-3">🤝</div>
        <h2 className="text-lg font-bold text-stone-800 mb-2">
          No transactions yet
        </h2>
        <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">
          Create a protected escrow transaction and share the link with your
          buyer or seller.
        </p>
        <button className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-100">
          Create Transaction →
        </button>
      </div>
    </div>
  );
}
