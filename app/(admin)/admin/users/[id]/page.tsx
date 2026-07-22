import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatAmount } from "@/lib/transaction/helpers";
import {
  adminSuspendUser,
  adminActivateUser,
  adminPromoteUser,
  adminDemoteUser,
  adminSendPasswordReset,
  adminResendClaimEmail,
} from "@/app/actions/admin";

const STATUS_MESSAGES: Record<string, { type: "success" | "error"; text: string }> = {
  suspended:   { type: "success", text: "User account has been suspended." },
  activated:   { type: "success", text: "User account has been reactivated." },
  promoted:    { type: "success", text: "User has been promoted to Admin." },
  demoted:     { type: "success", text: "User has been demoted to Personal." },
  reset_sent:  { type: "success", text: "Password reset email sent to user." },
  claim_sent:  { type: "success", text: "Claim email resent to user." },
  forbidden:   { type: "error",   text: "You don't have permission to perform that action." },
  no_email:    { type: "error",   text: "This user has no email address on file." },
  not_shadow:  { type: "error",   text: "This user's account is already claimed." },
};

const TXN_STATUS_COLORS: Record<string, string> = {
  CREATED:           "bg-stone-100 text-stone-600",
  AWAITING_PAYMENT:  "bg-amber-100 text-amber-700",
  FUNDED:            "bg-sky-100 text-sky-700",
  IN_PROGRESS:       "bg-blue-100 text-blue-700",
  DELIVERED:         "bg-violet-100 text-violet-700",
  UNDER_INSPECTION:  "bg-orange-100 text-orange-700",
  COMPLETED:         "bg-emerald-100 text-emerald-700",
  DISPUTED:          "bg-red-100 text-red-700",
  REFUNDED:          "bg-pink-100 text-pink-700",
  CANCELLED:         "bg-stone-100 text-stone-500",
};

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const { success, error } = await searchParams;

  const [session, user] = await Promise.all([
    getSession(),
    db.user.findUnique({
      where: { id },
      include: { business: true },
    }),
  ]);

  if (!user) notFound();

  const isSuperAdmin = session?.accountType === "SUPER_ADMIN";

  // Fetch party memberships with transaction details
  const parties = await db.transactionParty.findMany({
    where: { userId: id },
    include: {
      transaction: {
        select: {
          id: true,
          reference: true,
          title: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const totalTxns  = await db.transactionParty.count({ where: { userId: id } });
  const buyerCount  = await db.transactionParty.count({ where: { userId: id, role: "BUYER" } });
  const sellerCount = await db.transactionParty.count({ where: { userId: id, role: "SELLER" } });

  const banner = success
    ? STATUS_MESSAGES[success]
    : error
    ? STATUS_MESSAGES[error]
    : null;

  const suspendAction  = adminSuspendUser.bind(null, id);
  const activateAction = adminActivateUser.bind(null, id);
  const promoteAction  = adminPromoteUser.bind(null, id);
  const demoteAction   = adminDemoteUser.bind(null, id);
  const resetAction    = adminSendPasswordReset.bind(null, id);
  const claimAction    = adminResendClaimEmail.bind(null, id);

  const canManageRole =
    isSuperAdmin &&
    user.accountType !== "SUPER_ADMIN" &&
    user.id !== session?.userId;

  const canSuspend =
    user.accountType !== "SUPER_ADMIN" &&
    user.id !== session?.userId;

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        ← Back to Users
      </Link>

      {/* Banner */}
      {banner && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl border text-sm font-medium ${
            banner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: Profile + Actions ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-black text-emerald-700">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h1 className="text-lg font-bold text-stone-900">{user.name}</h1>
              <p className="text-sm text-stone-500 mt-0.5">{user.email ?? user.phone ?? "No contact"}</p>
              {user.phone && user.email && (
                <p className="text-xs text-stone-400">{user.phone}</p>
              )}

              <div className="flex gap-2 mt-3 flex-wrap justify-center">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    user.accountStatus === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : user.accountStatus === "SUSPENDED"
                      ? "bg-red-100 text-red-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {user.accountStatus}
                </span>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-600">
                  {user.accountType}
                </span>
                {!user.isClaimed && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    Shadow
                  </span>
                )}
                {!user.emailVerified && user.isClaimed && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-sky-100 text-sky-700">
                    Unverified email
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-500 border-t border-stone-100 pt-4">
              <div className="flex justify-between">
                <span>Joined</span>
                <span className="text-stone-700 font-medium">
                  {new Date(user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Channel</span>
                <span className="text-stone-700 font-medium">{user.channel}</span>
              </div>
              <div className="flex justify-between">
                <span>Email verified</span>
                <span className={user.emailVerified ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                  {user.emailVerified ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Account claimed</span>
                <span className={user.isClaimed ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                  {user.isClaimed ? "Yes" : "No"}
                </span>
              </div>
              {user.platformUrl && (
                <div className="flex justify-between">
                  <span>Platform</span>
                  <span className="text-stone-700 font-medium truncate max-w-[120px]">{user.platformUrl}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Transaction Stats</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-black text-stone-900">{totalTxns}</p>
                <p className="text-xs text-stone-400">Total</p>
              </div>
              <div>
                <p className="text-2xl font-black text-sky-700">{buyerCount}</p>
                <p className="text-xs text-stone-400">As Buyer</p>
              </div>
              <div>
                <p className="text-2xl font-black text-violet-700">{sellerCount}</p>
                <p className="text-xs text-stone-400">As Seller</p>
              </div>
            </div>
          </div>

          {/* Business profile */}
          {user.business && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Business</p>
              <p className="font-semibold text-stone-800">{user.business.name}</p>
              {user.business.website && (
                <p className="text-xs text-stone-400 mt-0.5">{user.business.website}</p>
              )}
              {user.business.description && (
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">{user.business.description}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Admin Actions</p>

            {/* Suspend / Activate */}
            {canSuspend && (
              user.accountStatus === "SUSPENDED" ? (
                <form action={activateAction}>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors text-left"
                  >
                    ✓ Activate account
                  </button>
                </form>
              ) : (
                <form action={suspendAction}>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors text-left"
                  >
                    ⊘ Suspend account
                  </button>
                </form>
              )
            )}

            {/* Promote / Demote — SUPER_ADMIN only */}
            {canManageRole && user.accountType === "ADMIN" && (
              <form action={demoteAction}>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-100 transition-colors text-left"
                >
                  ↓ Remove admin role
                </button>
              </form>
            )}
            {canManageRole && (user.accountType === "PERSONAL" || user.accountType === "BUSINESS") && (
              <form action={promoteAction}>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-100 transition-colors text-left"
                >
                  ↑ Promote to Admin
                </button>
              </form>
            )}

            {/* Send password reset */}
            {user.email && user.isClaimed && (
              <form action={resetAction}>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-100 transition-colors text-left"
                >
                  ✉ Send password reset email
                </button>
              </form>
            )}

            {/* Resend claim email */}
            {!user.isClaimed && user.email && (
              <form action={claimAction}>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors text-left"
                >
                  ✉ Resend claim email
                </button>
              </form>
            )}

            {user.id === session?.userId && (
              <p className="text-xs text-stone-400 text-center pt-1">
                Actions on your own account are disabled.
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Recent Transactions ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-stone-900">Recent Transactions</h2>
                <p className="text-stone-400 text-xs mt-0.5">Latest 10 of {totalTxns}</p>
              </div>
              {totalTxns > 0 && (
                <Link
                  href={`/admin/transactions?userId=${id}`}
                  className="text-xs text-emerald-700 font-semibold hover:underline"
                >
                  View all →
                </Link>
              )}
            </div>

            {parties.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm">
                No transactions yet
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {parties.map((party) => (
                  <Link
                    key={party.id}
                    href={`/admin/transactions/${party.transaction.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors truncate">
                          {party.transaction.title}
                        </p>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            party.role === "BUYER"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-violet-100 text-violet-700"
                          }`}
                        >
                          {party.role}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400">
                        {party.transaction.reference} ·{" "}
                        {new Date(party.transaction.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-stone-800">
                        ₦{formatAmount(party.transaction.amount)}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          TXN_STATUS_COLORS[party.transaction.status] ?? "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {party.transaction.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
