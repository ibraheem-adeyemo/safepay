export function ProgressBar({ taken, total, light = false }: { taken: number; total: number; light?: boolean }) {
  const pct = Math.round((taken / total) * 100);
  return (
    <div className="w-full">
      <div className={`flex justify-between text-xs mb-1.5 ${light ? "text-emerald-300" : "text-stone-500"}`}>
        <span>{taken} taken</span><span>{total - taken} left</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${light ? "bg-emerald-900" : "bg-stone-200"}`}>
        <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}