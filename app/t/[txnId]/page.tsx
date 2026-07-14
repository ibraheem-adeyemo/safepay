import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { StatusBadge } from "@/src/features/components/StatusBadge";
import {
  verifyInviteToken,
  formatAmount,
  getCounterpartyRole,
  STATUS_META,
} from "@/lib/transaction/helpers";
import { acceptTransactionAsLoggedIn } from "@/app/actions/transaction";
import AcceptForm from "./AcceptForm";

export default async function PublicTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ txnId: string }>;
  searchParams: Promise<{ token?: string; joined?: string; error?: string }>;
}) {
  const { txnId } = await params;
  const { token, joined, error } = await searchParams;

  const [session, transaction] = await Promise.all([
    getSession(),
    db.transaction.findUnique({
      where: { id: txnId },
      include: {
        parties: { include: { user: true } },
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">Transaction not found</h1>
          <p className="text-stone-500 text-sm">This link may have expired or been removed.</p>
          <Link href="/" className="mt-6 inline-block text-emerald-700 font-semibold text-sm hover:underline">
            Go to Vaultlify →
          </Link>
        </div>
      </div>
    );
  }

  // Resolve invite token (if provided)
  const tokenData = token ? await verifyInviteToken(token) : null;
  const tokenValid = tokenData?.txnId === txnId;

  // Determine the current viewer's relationship to this transaction
  const myParty = session
    ? transaction.parties.find((p) => p.userId === session.userId)
    : null;

  const initiatorParty = transaction.parties.find((p) => p.isInitiator);
  const counterpartyParty = transaction.parties.find((p) => !p.isInitiator);

  // Expected counterparty role from token
  const expectedRole = tokenData?.role ?? null;

  // Can the viewer accept as counterparty?
  const counterpartySlotEmpty = !counterpartyParty;
  const canAccept =
    tokenValid &&
    counterpartySlotEmpty &&
    transaction.status === "CREATED" &&
    !myParty; // viewer is not already a party

  // Viewer is logged in and can accept with one click (no form needed)
  const canAcceptAsLoggedIn = canAccept && !!session;
  // Viewer needs to fill the accept form (guest)
  const needsAcceptForm = canAccept && !session;

  const acceptLoggedInAction = acceptTransactionAsLoggedIn.bind(null, txnId, token ?? "");

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Minimal header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-black text-emerald-800 tracking-tight">
            Vault<span className="text-amber-500">lify</span>
          </Link>
          {session ? (
            <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-800 font-semibold transition-colors">
              My Dashboard →
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-emerald-800 transition-colors"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-4">

        {/* ── Success banner ── */}
        {joined === "1" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <p className="font-bold text-emerald-800 mb-1">🎉 You've joined this transaction!</p>
            <p className="text-sm text-emerald-700">
              Vaultlify is holding the escrow. You&apos;ll be notified as the transaction progresses.
            </p>
            {session && !myParty?.user.isClaimed && (
              <div className="mt-3 bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm">
                <p className="font-semibold text-stone-800 mb-1">Set a password to access your dashboard</p>
                <p className="text-stone-500 text-xs mb-2">
                  Your Vaultlify account was created. Set a password to manage all your transactions from one place.
                </p>
                <Link
                  href="/dashboard"
                  className="text-emerald-700 font-semibold text-xs hover:underline"
                >
                  Go to my dashboard →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Error banner ── */}
        {error === "invalid_token" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
            This invite link is invalid or has already been used.
          </div>
        )}
        {error === "already_party" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
            You are the initiator of this transaction and cannot also be the counterparty.
          </div>
        )}

        {/* ── Transaction summary card ── */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="bg-emerald-800 px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-1">
                  {transaction.reference}
                </p>
                <h1 className="text-white text-xl font-bold leading-snug">{transaction.title}</h1>
                {transaction.description && (
                  <p className="text-emerald-200 text-sm mt-1">{transaction.description}</p>
                )}
              </div>
              <StatusBadge status={transaction.status} />
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-emerald-300 text-xs">Transaction amount</p>
                <p className="text-white text-3xl font-black">₦{formatAmount(transaction.amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-300 text-xs">Protected by</p>
                <p className="text-white font-bold">🛡 Vaultlify</p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="px-6 py-4 border-b border-stone-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">
                  {initiatorParty?.role ?? "BUYER"}
                </p>
                {initiatorParty ? (
                  <>
                    <p className="font-semibold text-stone-800 text-sm">
                      {initiatorParty.user.name.split(" ")[0]}
                    </p>
                    <p className="text-xs text-stone-400">Initiator</p>
                  </>
                ) : (
                  <p className="text-stone-400 text-sm italic">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">
                  {initiatorParty ? getCounterpartyRole(initiatorParty.role) : "SELLER"}
                </p>
                {counterpartyParty ? (
                  <>
                    <p className="font-semibold text-stone-800 text-sm">
                      {myParty?.userId === counterpartyParty.userId
                        ? counterpartyParty.user.name
                        : counterpartyParty.user.name.split(" ")[0]}
                    </p>
                    <p className="text-xs text-stone-400">Counterparty</p>
                  </>
                ) : (
                  <p className="text-stone-400 text-sm italic">Awaiting…</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment instruction — buyer awaiting payment */}
          {transaction.status === "AWAITING_PAYMENT" && myParty?.role === "BUYER" && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">
                Payment required
              </p>
              <p className="text-sm text-blue-700 mb-3">
                Transfer <strong>₦{formatAmount(transaction.amount)}</strong> to complete the escrow:
              </p>
              <div className="bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Bank</span><span className="font-semibold">First Bank of Nigeria</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Account Name</span><span className="font-semibold">Vaultlify Escrow Ltd</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Account Number</span><span className="font-bold font-mono">0123456789</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Reference</span>
                  <span className="font-bold font-mono text-emerald-700">{transaction.reference}</span>
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-2">Include the reference in your transfer description.</p>
            </div>
          )}

          {/* Status timeline (for parties) */}
          {myParty && transaction.statusLogs.length > 0 && (
            <div className="px-6 py-5">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">
                Transaction Timeline
              </p>
              <div className="space-y-3">
                {transaction.statusLogs.map((log, i) => {
                  const meta = STATUS_META[log.toStatus] ?? { label: log.toStatus, colour: "text-stone-500" };
                  return (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === transaction.statusLogs.length - 1 ? "bg-emerald-600" : "bg-stone-300"}`} />
                        {i < transaction.statusLogs.length - 1 && (
                          <div className="w-px flex-1 bg-stone-200 my-1" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className={`text-sm font-semibold ${meta.colour}`}>{meta.label}</p>
                        {log.note && <p className="text-xs text-stone-400">{log.note}</p>}
                        <p className="text-xs text-stone-300">
                          {new Date(log.createdAt).toLocaleString("en-NG", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Accept section — logged-in user ── */}
        {canAcceptAsLoggedIn && expectedRole && (
          <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6">
            <h2 className="text-lg font-bold text-stone-800 mb-1">
              Accept as {expectedRole}
            </h2>
            <p className="text-stone-500 text-sm mb-4">
              You&apos;re signed in as <strong>{session.name}</strong>. Click below to join this
              transaction as the {expectedRole.toLowerCase()}.
            </p>
            <form action={acceptLoggedInAction}>
              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-100"
              >
                Accept Transaction as {expectedRole} →
              </button>
            </form>
            <p className="text-center text-xs text-stone-400 mt-3">
              Not you?{" "}
              <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
                Sign in with a different account
              </Link>
            </p>
          </div>
        )}

        {/* ── Accept section — guest form ── */}
        {needsAcceptForm && expectedRole && (
          <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6">
            <h2 className="text-lg font-bold text-stone-800 mb-1">
              Accept this transaction
            </h2>
            <p className="text-stone-500 text-sm mb-5">
              You&apos;ve been invited as the <strong>{expectedRole}</strong>. Enter your details to
              join and activate escrow protection.
            </p>
            <AcceptForm txnId={txnId} token={token!} expectedRole={expectedRole} />
            <p className="text-center text-xs text-stone-400 mt-4">
              Already have an account?{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/t/${txnId}?token=${token}`)}`}
                className="text-emerald-700 font-semibold hover:underline"
              >
                Sign in →
              </Link>
            </p>
          </div>
        )}

        {/* ── Not logged in, transaction already in progress ── */}
        {!canAccept && !myParty && transaction.status !== "CREATED" && (
          <div className="bg-white rounded-2xl border border-stone-200 px-6 py-8">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-lg font-bold text-stone-800 mb-2">Sign in to continue</h2>
              <p className="text-stone-500 text-sm">
                {transaction.status === "AWAITING_PAYMENT"
                  ? "This escrow is waiting for payment. Sign in to see exactly where to send your money."
                  : "This escrow is in progress. Sign in with your Vaultlify account to view details and take action."}
              </p>
            </div>

            {transaction.status === "AWAITING_PAYMENT" && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 text-sm text-amber-800">
                <p className="font-bold mb-0.5">Payment is waiting</p>
                <p className="text-xs text-amber-700">
                  The seller is ready. Sign in to get the bank account details and send{" "}
                  <strong>₦{formatAmount(transaction.amount)}</strong> to complete the escrow.
                </p>
              </div>
            )}

            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/t/${txnId}`)}`}
              className="w-full flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-100 mb-4"
            >
              Sign in to Vaultlify →
            </Link>

            <p className="text-center text-xs text-stone-400">
              New to Vaultlify?{" "}
              <Link href="/register" className="text-emerald-700 font-semibold hover:underline">
                Create a free account
              </Link>
              {" · "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/t/${txnId}`)}`}
                className="text-stone-500 hover:underline"
              >
                Already have an account? Sign in
              </Link>
            </p>
          </div>
        )}

        {/* ── Already a party — prompt to go to dashboard for full view ── */}
        {myParty && (
          <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5">
            <Link
              href={`/dashboard/transactions/${txnId}`}
              className="w-full flex items-center justify-between text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              <span>View full details in your dashboard</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
