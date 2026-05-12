"use client";

import { useActionState } from "react";
import { generateApiKey } from "@/app/actions/account";

export default function ApiKeyForm() {
  const [state, formAction, isPending] = useActionState(generateApiKey, undefined);

  // state.message holds the full key on success (only time it's visible)
  const newKey = state?.success ? state.message : null;

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      {newKey && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">
            Key generated — copy it now
          </p>
          <p className="text-xs text-emerald-600 mb-2">
            This is the only time you&apos;ll see the full key. Store it somewhere safe.
          </p>
          <code className="block bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-800 break-all select-all">
            {newKey}
          </code>
        </div>
      )}

      {state?.message && !state.success && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Key label</label>
        <input
          name="label"
          type="text"
          placeholder="e.g. Production, Mobile app"
          className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            state?.errors?.label ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
          }`}
        />
        {state?.errors?.label && (
          <p className="text-red-500 text-xs mt-1.5">{state.errors.label[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
      >
        {isPending ? "Generating…" : "Generate API key"}
      </button>
    </form>
  );
}
