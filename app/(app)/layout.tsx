import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-black text-emerald-800 tracking-tight">
              Safe<span className="text-amber-500">Pay</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <a href="/dashboard" className="hover:text-stone-900 transition-colors">
              Dashboard
            </a>
            <a href="/dashboard/transactions" className="hover:text-stone-900 transition-colors">
              Transactions
            </a>
            <a href="/dashboard/settings" className="hover:text-stone-900 transition-colors">
              Settings
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-600 hidden sm:block">
              {session.name}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-xs text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-lg transition-all"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
