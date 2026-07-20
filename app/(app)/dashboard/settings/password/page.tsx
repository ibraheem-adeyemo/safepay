"use client";

import { useActionState, useState } from "react";
import { changePassword } from "@/app/actions/account";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

export default function PasswordSettingsPage() {
  const [state, formAction, isPending] = useActionState(changePassword, undefined);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          <div className="relative">
            <input
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your current password"
              className={`w-full px-4 py-3 pr-11 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                state?.errors?.currentPassword ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showCurrent} />
            </button>
          </div>
          {state?.errors?.currentPassword && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.currentPassword[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">New password</label>
          <div className="relative">
            <input
              name="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={`w-full px-4 py-3 pr-11 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                state?.errors?.newPassword ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showNew} />
            </button>
          </div>
          {state?.errors?.newPassword && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.newPassword[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Confirm new password</label>
          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat new password"
              className={`w-full px-4 py-3 pr-11 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                state?.errors?.confirmPassword ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
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
