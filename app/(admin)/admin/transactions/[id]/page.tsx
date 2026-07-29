import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { StatusBadge } from "@/src/features/components/StatusBadge";
import { formatAmount, STATUS_META } from "@/lib/transaction/helpers";
import {
  adminConfirmPayment,
  adminMarkRefunded,
  adminInitiateDisbursement,
  adminCancelTransaction,
  adminResolveDispute,
  adminForceApprovalOutcome,
} from "@/app/actions/admin";
import type { TransactionStatus } from "@prisma/client";

export default async function AdminTransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      parties: { include: { user: true } },
      statusLogs: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      disputes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!transaction) notFound();

  const buyer = transaction.parties.find((p) => p.role === "BUYER");
  const seller = transaction.parties.find((p) => p.role === "SELLER");
  const status = transaction.status;
  const openDispute = transaction.disputes.find(
    (d) => d.status === "OPEN" || d.status === "UNDER_REVIEW"
  );

  // Which admin actions are available?
  const canConfirmPayment = status === "AWAITING_PAYMENT";
  const canRefund: TransactionStatus[] = ["FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION", "RECEIPT_CONFIRMED", "DISPUTED"];
  const canDisburse: TransactionStatus[] = ["FUNDED", "IN_PROGRESS", "DELIVERED", "UNDER_INSPECTION", "RECEIPT_CONFIRMED", "DISPUTED"];
  const canAdminCancel: TransactionStatus[] = ["CREATED", "AWAITING_PAYMENT"];
  const canResolveDispute = status === "DISPUTED";
  const isPendingApproval =
    status === "PENDING_DISBURSEMENT_APPROVAL" || status === "PENDING_REFUND_APPROVAL";
  const isSuperAdmin = session?.accountType === "SUPER_ADMIN";

  const confirmAction = adminConfirmPayment.bind(null, id);
  const refundAction = adminMarkRefunded.bind(null, id);
  const disburseAction = adminInitiateDisbursement.bind(null, id);
  const cancelAction = adminCancelTransaction.bind(null, id);
  const resolveAction = adminResolveDispute.bind(null, id);
  const forceAction = adminForceApprovalOutcome.bind(null, id);

  const isTerminal = ["COMPLETED", "CANCELLED", "REFUNDED"].includes(status);
  const awaitingParty = status === "PENDING_DISBURSEMENT_APPROVAL" ? buyer : seller;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        ← All Transactions
      </Link>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
          {error === "wrong_status" && "Action not available at the current transaction status."}
          {error === "invalid_outcome" && "Invalid dispute resolution outcome selected."}
          {error === "note_required" && "A note/reason is required for this action."}
          {(error === "no_buyer" || error === "no_seller") && "This transaction is missing a required party."}
          {!["wrong_status", "invalid_outcome", "note_required", "no_buyer", "no_seller"].includes(error) &&
            "An error occurred."}
        </div>
      )}

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
                  + ₦{formatAmount(transaction.feeAmount)} fee
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-emerald-300 text-xs">Channel</p>
              <p className="text-white font-bold">{transaction.channel}</p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="px-6 py-4 border-b border-stone-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">Buyer</p>
              {buyer ? (
                <>
                  <p className="font-semibold text-stone-800 text-sm">{buyer.user.name}</p>
                  <p className="text-xs text-stone-400">{buyer.user.email}</p>
                  {!buyer.user.isClaimed && (
                    <span className="text-xs text-amber-600 font-semibold">Shadow account</span>
                  )}
                </>
              ) : (
                <p className="text-stone-400 text-sm italic">Not joined</p>
              )}
            </div>
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">Seller</p>
              {seller ? (
                <>
                  <p className="font-semibold text-stone-800 text-sm">{seller.user.name}</p>
                  <p className="text-xs text-stone-400">{seller.user.email}</p>
                  {!seller.user.isClaimed && (
                    <span className="text-xs text-amber-600 font-semibold">Shadow account</span>
                  )}
                </>
              ) : (
                <p className="text-stone-400 text-sm italic">Not joined</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin note */}
        {transaction.adminNote && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Admin Note</p>
            <p className="text-sm text-amber-800">{transaction.adminNote}</p>
          </div>
        )}

        {/* Payment records */}
        {transaction.payments.length > 0 && (
          <div className="px-6 py-4 border-b border-stone-100">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
              Payment Records
            </p>
            <div className="space-y-2">
              {transaction.payments.map((pmt) => (
                <div key={pmt.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        pmt.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-700"
                          : pmt.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {pmt.status}
                    </span>
                    {pmt.note && <span className="text-stone-400 text-xs ml-2">{pmt.note}</span>}
                  </div>
                  <span className="font-bold text-stone-800">₦{formatAmount(pmt.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open dispute details */}
        {openDispute && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-100">
            <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2">Open Dispute</p>
            <p className="text-sm font-semibold text-stone-800">{openDispute.reason}</p>
            {openDispute.description && (
              <p className="text-xs text-stone-500 mt-1">{openDispute.description}</p>
            )}
            <p className="text-xs text-stone-400 mt-2">
              Raised{" "}
              {new Date(openDispute.createdAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>

      {/* Pending approval banner */}
      {isPendingApproval && (
        <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 mb-4">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">
            Awaiting Party Approval
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
            <p className="text-sm font-bold text-amber-800 mb-1">
              Waiting on {status === "PENDING_DISBURSEMENT_APPROVAL" ? "buyer" : "seller"}
              {awaitingParty ? ` — ${awaitingParty.user.name}` : ""}
            </p>
            {transaction.approvalNote && (
              <p className="text-xs text-amber-700 mb-2">Reason given: {transaction.approvalNote}</p>
            )}
            {transaction.approvalRequestedAt && (
              <p className="text-xs text-amber-600">
                Requested{" "}
                {new Date(transaction.approvalRequestedAt).toLocaleString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            {transaction.approvalDeclineCount > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <p className="text-xs font-bold text-red-700">
                  Declined {transaction.approvalDeclineCount}x — last reason:
                </p>
                <p className="text-xs text-red-600">{transaction.approvalDeclineNote}</p>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <form action={forceAction} className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-bold text-red-800 mb-1">Force Outcome (Super Admin)</p>
              <p className="text-xs text-red-600 mb-3">
                Last resort — bypasses the pending approval and moves the transaction to its final
                state immediately. Always logged and both parties are notified.
              </p>
              <textarea
                name="note"
                rows={2}
                required
                placeholder="Justification for forcing this outcome"
                className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-red-400 mb-3 resize-none"
              />
              <button
                type="submit"
                className="bg-white hover:bg-red-50 border border-red-300 text-red-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
              >
                Force Outcome Now
              </button>
            </form>
          )}
        </div>
      )}

      {/* Admin actions panel */}
      {!isTerminal && !isPendingApproval && (
        <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 mb-4">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">
            Admin Actions
          </p>

          <div className="space-y-4">
            {/* Confirm payment */}
            {canConfirmPayment && (
              <form action={confirmAction} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm font-bold text-emerald-800 mb-1">Confirm Payment Received</p>
                <p className="text-xs text-emerald-600 mb-3">
                  Marks the escrow as funded. Only do this after verifying the bank transfer.
                </p>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Optional note (e.g. Verified via First Bank statement)"
                  className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-400 mb-3 resize-none"
                />
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  ✅ Confirm Payment → Fund Escrow
                </button>
              </form>
            )}

            {/* Resolve dispute */}
            {canResolveDispute && (
              <form action={resolveAction} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-800 mb-1">Resolve Dispute</p>
                <p className="text-xs text-red-600 mb-3">
                  This sends the buyer or seller an approval request — funds won&apos;t move until
                  they respond, or a super admin forces the outcome.
                </p>
                <select
                  name="outcome"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-stone-700 outline-none focus:ring-2 focus:ring-red-400 mb-3"
                >
                  <option value="">— Select outcome —</option>
                  <option value="COMPLETED">Release to Seller (Complete)</option>
                  <option value="REFUNDED">Refund to Buyer</option>
                </select>
                <textarea
                  name="resolution"
                  rows={2}
                  required
                  placeholder="Resolution note (visible in transaction history)"
                  className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-red-400 mb-3 resize-none"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  Resolve Dispute
                </button>
              </form>
            )}

            {/* Disburse to seller */}
            {canDisburse.includes(status) && !canResolveDispute && (
              <form action={disburseAction} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm font-bold text-emerald-800 mb-1">Disburse to Seller</p>
                <p className="text-xs text-emerald-700 mb-3">
                  This sends the buyer an approval request — funds won&apos;t move until they
                  respond, or a super admin forces the outcome.
                </p>
                <textarea
                  name="note"
                  rows={2}
                  required
                  placeholder="Reason for releasing funds (shown to the buyer)"
                  className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-400 mb-3 resize-none"
                />
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  Disburse to Seller
                </button>
              </form>
            )}

            {/* Refund */}
            {canRefund.includes(status) && !canResolveDispute && (
              <form action={refundAction} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-bold text-amber-800 mb-1">Issue Refund</p>
                <p className="text-xs text-amber-700 mb-3">
                  This sends the seller an approval request — funds won&apos;t move until they
                  respond, or a super admin forces the outcome.
                </p>
                <textarea
                  name="note"
                  rows={2}
                  required
                  placeholder="Reason for refund (shown to the seller)"
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-amber-400 mb-3 resize-none"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  Issue Refund
                </button>
              </form>
            )}

            {/* Cancel */}
            {canAdminCancel.includes(status) && (
              <form action={cancelAction} className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                <p className="text-sm font-bold text-stone-700 mb-1">Cancel Transaction</p>
                <p className="text-xs text-stone-500 mb-3">
                  Only available before payment is confirmed.
                </p>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Reason for cancellation"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-300 mb-3 resize-none"
                />
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
            const meta = STATUS_META[log.toStatus] ?? {
              label: log.toStatus,
              colour: "text-stone-500",
            };
            return (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                      i === transaction.statusLogs.length - 1
                        ? "bg-emerald-600"
                        : "bg-stone-300"
                    }`}
                  />
                  {i < transaction.statusLogs.length - 1 && (
                    <div className="w-px flex-1 bg-stone-200 my-1" />
                  )}
                </div>
                <div className="pb-2">
                  <p className={`text-sm font-semibold ${meta.colour}`}>{meta.label}</p>
                  {log.note && <p className="text-xs text-stone-400 mt-0.5">{log.note}</p>}
                  <p className="text-xs text-stone-300 mt-0.5">
                    {new Date(log.createdAt).toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
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
