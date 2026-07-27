"use client";

import { useState } from "react";
import { requestPayout } from "@/app/actions/transaction";

export default function RequestPayoutButton({
  txnId,
  amount,
  sellerName,
}: {
  txnId: string;
  amount: string;
  sellerName: string;
}) {
  const boundAction = requestPayout.bind(null, txnId);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
      >
        💸 Request Payout to Seller
      </button>
    );
  }

  return (
    <div className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-4">
      <p className="text-sm font-bold text-stone-800 mb-1">Are you sure?</p>
      <p className="text-xs text-stone-500 mb-3">
        This releases ₦{amount} to {sellerName} and cannot be undone.
      </p>
      <div className="flex items-center gap-3">
        <form action={boundAction}>
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
          >
            Yes, Release Payment
          </button>
        </form>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-stone-500 font-semibold hover:text-stone-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
