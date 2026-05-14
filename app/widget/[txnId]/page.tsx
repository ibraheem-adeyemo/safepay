import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  verifyInviteToken,
  formatAmount,
  getCounterpartyRole,
  STATUS_META,
} from "@/lib/transaction/helpers";
import {
  widgetAcceptAsGuest,
  widgetAcceptAsLoggedIn,
  widgetMarkDelivered,
  widgetConfirmReceipt,
} from "@/app/actions/widget";
import { WidgetEvents } from "./WidgetEvents";
import WidgetAcceptForm from "./AcceptForm";

export default async function WidgetPage({
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
      <div className="flex flex-col items-center justify-center min-h-75 px-6 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h1 className="text-base font-bold text-stone-800 mb-1">Transaction not found</h1>
        <p className="text-stone-500 text-sm">This link may have expired or been removed.</p>
      </div>
    );
  }

  const tokenData = token ? await verifyInviteToken(token) : null;

  const myParty = session
    ? transaction.parties.find((p) => p.userId === session.userId)
    : null;

  const initiatorParty = transaction.parties.find((p) => p.isInitiator);
  const counterpartyParty = transaction.parties.find((p) => !p.isInitiator);

  const counterpartySlotEmpty = !counterpartyParty;
  // Allow accepting without a token — the widget is embedded by the business in their
  // own authenticated platform, so the txnId alone is sufficient access control.
  const canAccept =
    counterpartySlotEmpty &&
    transaction.status === "CREATED" &&
    !myParty;

  const canAcceptAsLoggedIn = canAccept && !!session;
  const needsAcceptForm = canAccept && !session;

  // Role from token if present; otherwise derive from the initiator's role
  const expectedRole =
    tokenData?.role ?? (initiatorParty ? getCounterpartyRole(initiatorParty.role) : null);
  const statusMeta = STATUS_META[transaction.status] ?? { label: transaction.status, colour: "text-stone-500", bg: "bg-stone-100" };

  // Bound server actions
  const acceptLoggedInAction = widgetAcceptAsLoggedIn.bind(null, txnId, token ?? "");
  const guestAcceptAction = widgetAcceptAsGuest.bind(null, txnId, token ?? "");
  const deliverAction = widgetMarkDelivered.bind(null, txnId);
  const confirmAction = widgetConfirmReceipt.bind(null, txnId);

  return (
    <div className="px-4 py-5 space-y-4 max-w-sm mx-auto">
      {/* postMessage events */}
      <WidgetEvents
        transactionId={txnId}
        status={transaction.status}
        joined={joined === "1"}
      />

      {/* ── Joined success banner ── */}
      {joined === "1" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 space-y-3">
          <div>
            <p className="font-bold text-emerald-800 text-sm">You've joined this transaction!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              SafePay is holding the escrow. You'll be notified as it progresses.
            </p>
          </div>
          {myParty && !myParty.user.isClaimed && (
            <div className="border-t border-emerald-200 pt-3 space-y-2">
              <p className="text-xs text-emerald-800">
                <strong>Check your email</strong> — we sent a link to{" "}
                <span className="font-mono">{myParty.user.email}</span> to set up your SafePay password.
              </p>
              <a
                href="/claim"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Set up my SafePay account →
              </a>
              <p className="text-xs text-emerald-600 text-center">
                Opens in a new tab — your transaction stays open here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Error banners ── */}
      {error === "invalid_token" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-xs text-red-700">
          This invite link is invalid or has already been used.
        </div>
      )}
      {error === "already_party" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700">
          You initiated this transaction and cannot also be the counterparty.
        </div>
      )}
      {error === "auth_required" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800">
          Your session expired. Please{" "}
          <a href="/login" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            sign in
          </a>{" "}
          and return here to continue.
        </div>
      )}

      {/* ── Transaction card ── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-emerald-800 px-5 py-4">
          <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-0.5">
            {transaction.reference}
          </p>
          <h1 className="text-white text-base font-bold leading-snug">{transaction.title}</h1>
          {transaction.description && (
            <p className="text-emerald-200 text-xs mt-0.5">{transaction.description}</p>
          )}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-emerald-300 text-xs">Amount</p>
              <p className="text-white text-2xl font-black">₦{formatAmount(transaction.amount)}</p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.bg} ${statusMeta.colour}`}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* Parties */}
        <div className="px-5 py-3 border-b border-stone-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-0.5">
                {initiatorParty?.role ?? "BUYER"}
              </p>
              {initiatorParty ? (
                <p className="font-semibold text-stone-800 text-sm">
                  {initiatorParty.user.name.split(" ")[0]}
                </p>
              ) : (
                <p className="text-stone-400 text-sm italic">—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-0.5">
                {initiatorParty ? getCounterpartyRole(initiatorParty.role) : "SELLER"}
              </p>
              {counterpartyParty ? (
                <p className="font-semibold text-stone-800 text-sm">
                  {counterpartyParty.user.name.split(" ")[0]}
                </p>
              ) : (
                <p className="text-stone-400 text-sm italic">Awaiting…</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment instruction — buyer in AWAITING_PAYMENT */}
        {transaction.status === "AWAITING_PAYMENT" && myParty?.role === "BUYER" && (
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">
              Payment required
            </p>
            <p className="text-sm text-blue-700 mb-2">
              Transfer <strong>₦{formatAmount(transaction.amount)}</strong> to:
            </p>
            <div className="bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-xs space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Bank</span><span className="font-semibold">First Bank of Nigeria</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Account</span><span className="font-semibold">SafePay Escrow Ltd</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Number</span><span className="font-bold font-mono">0123456789</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Reference</span>
                <span className="font-bold font-mono text-emerald-700">{transaction.reference}</span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline — only shown to parties */}
        {myParty && transaction.statusLogs.length > 0 && (
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
              Timeline
            </p>
            <div className="space-y-2.5">
              {transaction.statusLogs.map((log, i) => {
                const meta = STATUS_META[log.toStatus] ?? { label: log.toStatus, colour: "text-stone-500" };
                return (
                  <div key={log.id} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 ${
                          i === transaction.statusLogs.length - 1 ? "bg-emerald-600" : "bg-stone-300"
                        }`}
                      />
                      {i < transaction.statusLogs.length - 1 && (
                        <div className="w-px flex-1 bg-stone-200 my-1" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className={`text-xs font-semibold ${meta.colour}`}>{meta.label}</p>
                      {log.note && <p className="text-xs text-stone-400">{log.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Accept — logged-in user (one click) ── */}
      {canAcceptAsLoggedIn && expectedRole && (
        <div className="bg-white rounded-2xl border border-stone-200 px-5 py-5">
          <h2 className="text-sm font-bold text-stone-800 mb-1">
            Accept as {expectedRole}
          </h2>
          <p className="text-stone-500 text-xs mb-3">
            You're signed in as <strong>{session!.name}</strong>. Click to join.
          </p>
          <form action={acceptLoggedInAction}>
            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm"
            >
              Accept as {expectedRole} →
            </button>
          </form>
        </div>
      )}

      {/* ── Accept — guest form ── */}
      {needsAcceptForm && expectedRole && (
        <div className="bg-white rounded-2xl border border-stone-200 px-5 py-5">
          <h2 className="text-sm font-bold text-stone-800 mb-1">Accept this transaction</h2>
          <p className="text-stone-500 text-xs mb-4">
            You've been invited as the <strong>{expectedRole}</strong>. Enter your details to join.
          </p>
          <WidgetAcceptForm
            expectedRole={expectedRole}
            action={guestAcceptAction}
            defaultValues={tokenData?.prefill}
          />
        </div>
      )}

      {/* ── Seller: mark delivered ── */}
      {myParty?.role === "SELLER" &&
        ["FUNDED", "IN_PROGRESS"].includes(transaction.status) && (
          <div className="bg-white rounded-2xl border border-stone-200 px-5 py-5">
            <p className="text-sm font-bold text-stone-800 mb-1">Ready to deliver?</p>
            <p className="text-stone-500 text-xs mb-3">
              Mark this transaction as delivered once you've sent the item/service.
            </p>
            <form action={deliverAction}>
              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                Mark as Delivered →
              </button>
            </form>
          </div>
        )}

      {/* ── Buyer: confirm receipt ── */}
      {myParty?.role === "BUYER" &&
        ["DELIVERED", "UNDER_INSPECTION"].includes(transaction.status) && (
          <div className="bg-white rounded-2xl border border-stone-200 px-5 py-5">
            <p className="text-sm font-bold text-stone-800 mb-1">Received your item?</p>
            <p className="text-stone-500 text-xs mb-3">
              Confirm receipt to release payment to the seller.
            </p>
            <form action={confirmAction}>
              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                Confirm Receipt →
              </button>
            </form>
          </div>
        )}

      {/* ── Terminal states ── */}
      {transaction.status === "COMPLETED" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-emerald-800 text-sm">Transaction completed</p>
          <p className="text-xs text-emerald-600 mt-0.5">Payment has been released to the seller.</p>
        </div>
      )}
      {transaction.status === "CANCELLED" && (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-2xl mb-1">❌</p>
          <p className="font-bold text-stone-700 text-sm">Transaction cancelled</p>
        </div>
      )}
      {transaction.status === "DISPUTED" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-2xl mb-1">⚠️</p>
          <p className="font-bold text-red-800 text-sm">Dispute in progress</p>
          <p className="text-xs text-red-600 mt-0.5">Our team will reach out to both parties shortly.</p>
        </div>
      )}

      {/* ── Locked state (not a party, not invited) ── */}
      {!canAccept && !myParty && !["COMPLETED", "CANCELLED", "DISPUTED"].includes(transaction.status) && (
        <div className="bg-white rounded-2xl border border-stone-200 px-5 py-6 text-center">
          <div className="text-3xl mb-2">🔒</div>
          <p className="font-bold text-stone-800 text-sm">Transaction in progress</p>
          <p className="text-stone-500 text-xs mt-1">
            If you are a party to this escrow, sign in to view the details.
          </p>
        </div>
      )}
    </div>
  );
}
