"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/account";

export default function PasswordSettingsPage() {
  const [state, formAction, isPending] = useActionState(changePassword, undefined);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6">
      <h2 className="text-base font-bold text-stone-900 mb-1">Change Password</h2>
      <p className="text-stone-400 text-xs mb-5">Keep your account secure with a strong password.</p>

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
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Current password</label>
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Your current password"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.currentPassword ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
            }`}
          />
          {state?.errors?.currentPassword && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.currentPassword[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">New password</label>
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.newPassword ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
            }`}
          />
          {state?.errors?.newPassword && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.newPassword[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Confirm new password</label>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat new password"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.confirmPassword ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
            }`}
          />
          {state?.errors?.confirmPassword && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.confirmPassword[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
        >
          {isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
