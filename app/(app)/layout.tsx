import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { db } from "@/lib/db";
import NotificationBell from "@/app/(app)/dashboard/NotificationBell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { isClaimed: true },
  });

  const unreadCount = await db.notification.count({
    where: { userId: session.userId, isRead: false },
  });

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Claim account banner */}
      {user && !user.isClaimed && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-center text-sm font-medium">
          Your account isn&apos;t secured yet.{" "}
          <Link href="/claim" className="underline font-bold hover:text-amber-100">
            Set a password to protect your account →
          </Link>
        </div>
      )}

      {/* Top nav */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-black text-emerald-800 tracking-tight">
              Safe<span className="text-amber-500">Pay</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link href="/dashboard" className="hover:text-stone-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/transactions" className="hover:text-stone-900 transition-colors">
              Transactions
            </Link>
            <NotificationBell initialCount={unreadCount} />
            <Link href="/dashboard/settings" className="hover:text-stone-900 transition-colors">
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-600 hidden sm:block">{session.name}</span>
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
