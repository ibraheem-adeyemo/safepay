"use client";

import { useActionState } from "react";

type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export default function WidgetAcceptForm({
  expectedRole,
  action,
}: {
  expectedRole: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      {state?.message && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong>You are joining as the {expectedRole}.</strong> Fill in your details to accept
        this protected transaction.
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Full name</label>
        <input
          name="name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Amaka Okafor"
          className={`w-full px-3 py-2.5 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            state?.errors?.name ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
          }`}
        />
        {state?.errors?.name && (
          <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Email address</label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          className={`w-full px-3 py-2.5 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            state?.errors?.email ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
          }`}
        />
        {state?.errors?.email && (
          <p className="text-red-500 text-xs mt-1">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1.5">
          Phone <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+2348012345678"
          className={`w-full px-3 py-2.5 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            state?.errors?.phone ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
          }`}
        />
        {state?.errors?.phone && (
          <p className="text-red-500 text-xs mt-1">{state.errors.phone[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm"
      >
        {isPending ? "Accepting…" : `Accept as ${expectedRole} →`}
      </button>

      <p className="text-center text-xs text-stone-400">
        A SafePay account will be created for you — no spam.
      </p>
    </form>
  );
}
