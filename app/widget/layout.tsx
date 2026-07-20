export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1">{children}</div>
      <div className="border-t border-stone-100 py-3 text-center">
        <p className="text-xs text-stone-400">
          Secured by{" "}
          <span className="font-black text-emerald-800">
            Vault<span className="text-amber-500">lify</span>
          </span>
        </p>
      </div>
    </div>
  );
}
