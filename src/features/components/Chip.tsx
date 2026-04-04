export function Chip({ selected, onClick, children, color = "green" }: { selected: boolean; onClick: () => void; children: React.ReactNode; color?: "green" | "red" | "amber" | "blue" }) {
  const styles = {
    green: selected ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300",
    red:   selected ? "border-red-400 bg-red-50 text-red-800"             : "border-stone-200 bg-white text-stone-600 hover:border-red-200",
    amber: selected ? "border-amber-500 bg-amber-50 text-amber-800"       : "border-stone-200 bg-white text-stone-600 hover:border-amber-300",
    blue:  selected ? "border-blue-500 bg-blue-50 text-blue-800"          : "border-stone-200 bg-white text-stone-600 hover:border-blue-300",
  };
  return (
    <button type="button" onClick={onClick} className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.97] ${styles[color]}`}>
      {children}
    </button>
  );
}