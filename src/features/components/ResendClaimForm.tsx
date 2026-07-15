"use client";

import { useActionState } from "react";
import type { ResendClaimState } from "@/app/actions/widget";

export function ResendClaimForm({
  action,
  compact = false,
}: {
  action: (state: ResendClaimState, formData: FormData) => Promise<ResendClaimState>;
  compact?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  if (state?.success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 text-center">
        <p className={`font-bold text-emerald-800 ${compact ? "text-sm" : "text-base"} mb-1`}>
          Check your email!
        </p>
        <p className={`text-emerald-700 ${compact ? "text-xs" : "text-sm"}`}>
          {state.message}
        </p>
        <p className={`text-emerald-600 mt-2 ${compact ? "text-xs" : "text-sm"}`}>
          Didn&apos;t receive it?{" "}
          <button
            onClick={() => window.location.reload()}
            className="underline font-semibold"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input
        type="email"
        name="email"
        required
        placeholder="Enter the email address used for this transaction"
        className={`w-full border border-stone-200 rounded-xl px-4 ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
      />
      {state?.message && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className={`w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 active:scale-[0.98] text-white font-bold ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} rounded-xl transition-all`}
      >
        {isPending ? "Sending…" : "Send me a setup link →"}
      </button>
    </form>
  );
}
