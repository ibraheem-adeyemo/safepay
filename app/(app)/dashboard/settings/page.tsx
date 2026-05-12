"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/account";

export default function ProfileSettingsPage() {
  const [state, formAction, isPending] = useActionState(updateProfile, undefined);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6">
      <h2 className="text-base font-bold text-stone-900 mb-1">Profile</h2>
      <p className="text-stone-400 text-xs mb-5">Update your name and contact information.</p>

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-semibold mb-5">
          {state.message}
        </div>
      )}
      {state?.message && !state.success && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-5">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full name</label>
          <input
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.name ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
            }`}
          />
          {state?.errors?.name && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Phone number <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+2348012345678"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.phone ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
            }`}
          />
          {state?.errors?.phone && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.phone[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
