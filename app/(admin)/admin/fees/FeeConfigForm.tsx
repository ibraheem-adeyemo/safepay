"use client";

import { useActionState, useState } from "react";
import { adminUpdateFeeConfig } from "@/app/actions/admin";
import type { FeeType } from "@prisma/client";

type Props = {
  currentType: FeeType;
  currentValue: number;
};

export default function FeeConfigForm({ currentType, currentValue }: Props) {
  const [state, formAction, isPending] = useActionState(adminUpdateFeeConfig, undefined);
  const [feeType, setFeeType] = useState<FeeType>(currentType);

  return (
    <form action={formAction} className="space-y-5">
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-semibold">
          {state.message}
        </div>
      )}
      {state?.message && !state.success && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Fee type */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-2">Fee Type</label>
        <div className="flex gap-3 flex-wrap">
          {(["PERCENTAGE", "FIXED", "FREE"] as FeeType[]).map((type) => (
            <label
              key={type}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm font-semibold transition-colors ${
                feeType === type
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              <input
                type="radio"
                name="feeType"
                value={type}
                checked={feeType === type}
                onChange={() => setFeeType(type)}
                className="sr-only"
              />
              {type === "PERCENTAGE" && "% Percentage"}
              {type === "FIXED" && "₦ Fixed amount"}
              {type === "FREE" && "🎁 Free"}
            </label>
          ))}
        </div>
        {state?.errors?.feeType && (
          <p className="text-red-500 text-xs mt-1.5">{state.errors.feeType[0]}</p>
        )}
      </div>

      {/* Fee value */}
      {feeType !== "FREE" && (
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {feeType === "PERCENTAGE" ? "Percentage (e.g. 1.5 for 1.5%)" : "Fixed amount in ₦"}
          </label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm">
              {feeType === "PERCENTAGE" ? "%" : "₦"}
            </span>
            <input
              name="feeValue"
              type="number"
              step="0.0001"
              min="0"
              defaultValue={currentValue}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          {state?.errors?.feeValue && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.feeValue[0]}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
      >
        {isPending ? "Saving…" : "Save Fee Configuration"}
      </button>
    </form>
  );
}
