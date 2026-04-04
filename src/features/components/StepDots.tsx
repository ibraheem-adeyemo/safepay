export function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${i < current ? "w-6 h-2 bg-emerald-400" : i === current ? "w-6 h-2 bg-emerald-700" : "w-2 h-2 bg-stone-200"}`} />
      ))}
    </div>
  );
}