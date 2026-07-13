"use client";

import { useActionState, useState } from "react";
import { raiseDispute } from "@/app/actions/transaction";

export default function DisputeForm({ txnId }: { txnId: string }) {
  const boundAction = raiseDispute.bind(null, txnId);
  const [state, formAction, isPending] = useActionState(boundAction, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 font-semibold hover:text-red-800 transition-colors underline underline-offset-2"
      >
        Raise a dispute
      </button>
    );
  }

  return (
    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-red-800">Raise a Dispute</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-stone-400 hover:text-stone-600 text-xs"
        >
          Cancel
        </button>
      </div>

      {state?.message && (
        <div className="bg-white border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-3">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <input
            name="reason"
            type="text"
            required
            placeholder="e.g. Item not received after 2 weeks"
            className={`w-full px-3 py-2 rounded-lg border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-red-400 ${
              state?.errors?.reason ? "border-red-400 bg-red-50" : "border-stone-200 bg-white"
            }`}
          />
          {state?.errors?.reason && (
            <p className="text-red-500 text-xs mt-1">{state.errors.reason[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Details <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Describe the issue in more detail…"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>

        <p className="text-xs text-stone-500">
          A Vaultlify admin will review this dispute and contact both parties. The transaction will
          be frozen until resolved.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm transition-all active:scale-[0.98]"
        >
          {isPending ? "Submitting…" : "Submit Dispute"}
        </button>
      </form>
    </div>
  );
}
