import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.accountType !== "ADMIN" && session.accountType !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Admin top bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-emerald-800 tracking-tight">
              Vault<span className="text-amber-500">lify</span>
            </span>
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              ADMIN
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-stone-500">
            <a href="/admin" className="hover:text-stone-900 transition-colors">
              Overview
            </a>
            <a href="/admin/transactions" className="hover:text-stone-900 transition-colors">
              Transactions
            </a>
            <a href="/admin/users" className="hover:text-stone-900 transition-colors">
              Users
            </a>
            <a href="/admin/disputes" className="hover:text-stone-900 transition-colors">
              Disputes
            </a>
            <a href="/admin/fees" className="hover:text-stone-900 transition-colors">
              Fee Config
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400 hidden sm:block">
              {session.name} · {session.accountType}
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
