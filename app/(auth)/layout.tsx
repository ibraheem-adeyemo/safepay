export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">
              Safe<span className="text-amber-500">Pay</span>
            </span>
          </a>
          <p className="text-stone-500 text-sm mt-1">Secure escrow for every deal</p>
        </div>
        {children}
      </div>
    </div>
  );
}
