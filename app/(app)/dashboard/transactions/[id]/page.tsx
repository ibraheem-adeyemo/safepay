import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { StatusBadge } from "@/src/features/components/StatusBadge";
import {
  generateInviteToken,
  buildShareUrl,
  formatAmount,
  getCounterpartyRole,
  STATUS_META,
} from "@/lib/transaction/helpers";
import {
  cancelTransaction,
  markAsDelivered,
  confirmReceipt,
} from "@/app/actions/transaction";
import type { PartyRole } from "@prisma/client";
import CopyButton from "./CopyButton";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      parties: { include: { user: true } },
      statusLogs: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!transaction) notFound();

  const myParty = transaction.parties.find((p) => p.userId === session.userId);
  if (!myParty) notFound(); // not a party to this transaction

  const counterpartyParty = transaction.parties.find((p) => p.userId !== session.userId);
  const myRole: PartyRole = myParty.role;
  const counterpartyRole = getCounterpartyRole(myRole);
  const status = transaction.status;

  // Generate the shareable invite link (valid 7 days, regenerated on each view)
  const inviteToken = await generateInviteToken(id, counterpartyRole);
  const shareUrl = buildShareUrl(id, inviteToken);

  // What actions can I take right now?
  const canCancel = ["CREATED", "AWAITING_PAYMENT"].includes(status);
  const canMarkDelivered = myRole === "SELLER" && ["FUNDED", "IN_PROGRESS"].includes(status);
  const canConfirmReceipt = myRole === "BUYER" && ["DELIVERED", "UNDER_INSPECTION"].includes(status);

  const cancelAction = cancelTransaction.bind(null, id);
  const deliverAction = markAsDelivered.bind(null, id);
  const confirmAction = confirmReceipt.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        ← All Transactions
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-4">
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
            <StatusBadge status={status} />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-emerald-300 text-xs">Transaction amount</p>
              <p className="text-white text-3xl font-black">₦{formatAmount(transaction.amount)}</p>
              {transaction.feeAmount && Number(transaction.feeAmount) > 0 && (
                <p className="text-emerald-300 text-xs mt-0.5">
                  + ₦{formatAmount(transaction.feeAmount)} SafePay fee
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-emerald-300 text-xs">Your role</p>
              <p className="text-white font-bold text-lg">{myRole}</p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="px-6 py-4 border-b border-stone-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">
                {myRole}
              </p>
              <p className="font-semibold text-stone-800 text-sm">{myParty.user.name}</p>
              <p className="text-xs text-stone-400">{myParty.user.email}</p>
              <span className="text-xs text-emerald-600 font-semibold">You</span>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">
                {counterpartyRole}
              </p>
              {counterpartyParty ? (
                <>
                  <p className="font-semibold text-stone-800 text-sm">{counterpartyParty.user.name}</p>
                  <p className="text-xs text-stone-400">{counterpartyParty.user.email}</p>
                  {!counterpartyParty.user.isClaimed && (
                    <span className="text-xs text-amber-600 font-semibold">Account not claimed</span>
                  )}
                </>
              ) : (
                <p className="text-stone-400 text-sm italic">Waiting for counterparty…</p>
              )}
            </div>
          </div>
        </div>

        {/* Share link — shown while counterparty hasn't joined */}
        {!counterpartyParty && (
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">
              Share this link with the {counterpartyRole.toLowerCase()}
            </p>
            <p className="text-xs text-amber-600 mb-3">
              They&apos;ll see the transaction details and can accept securely. Link expires in 7 days.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs text-stone-700 font-mono outline-none truncate"
              />
              <CopyButton text={shareUrl} />
            </div>
          </div>
        )}

        {/* Payment info — awaiting payment */}
        {status === "AWAITING_PAYMENT" && myRole === "BUYER" && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">
              Payment required
            </p>
            <p className="text-sm text-blue-700">
              Transfer <strong>₦{formatAmount(transaction.amount)}</strong> to the SafePay escrow account.
              Our team will confirm receipt and update the status.
            </p>
            <div className="mt-3 bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Bank</span><span className="font-semibold">First Bank of Nigeria</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Account Name</span><span className="font-semibold">SafePay Escrow Ltd</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Account Number</span><span className="font-semibold font-mono">0123456789</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Reference</span>
                <span className="font-semibold font-mono text-emerald-700">{transaction.reference}</span>
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-2">
              Include the reference number in your transfer description.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(canCancel || canMarkDelivered || canConfirmReceipt) && (
        <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 mb-4">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
            Your Actions
          </p>
          <div className="flex flex-wrap gap-3">
            {canMarkDelivered && (
              <form action={deliverAction}>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  ✅ Mark as Delivered
                </button>
              </form>
            )}
            {canConfirmReceipt && (
              <form action={confirmAction}>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  ✅ Confirm Receipt
                </button>
              </form>
            )}
            {canCancel && (
              <form action={cancelAction}>
                <button
                  type="submit"
                  className="bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  Cancel Transaction
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Status timeline */}
      <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">
          Status Timeline
        </p>
        <div className="space-y-4">
          {transaction.statusLogs.map((log, i) => {
            const meta = STATUS_META[log.toStatus] ?? { label: log.toStatus, colour: "text-stone-500", bg: "bg-stone-100" };
            return (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === transaction.statusLogs.length - 1 ? "bg-emerald-600" : "bg-stone-300"}`} />
                  {i < transaction.statusLogs.length - 1 && (
                    <div className="w-px flex-1 bg-stone-200 my-1" />
                  )}
                </div>
                <div className="pb-2">
                  <p className={`text-sm font-semibold ${meta.colour}`}>{meta.label}</p>
                  {log.note && <p className="text-xs text-stone-400 mt-0.5">{log.note}</p>}
                  <p className="text-xs text-stone-300 mt-0.5">
                    {new Date(log.createdAt).toLocaleString("en-NG", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
