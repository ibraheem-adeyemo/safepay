"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { claimAccount } from "@/app/actions/account";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

export default function ClaimForm({ token }: { token?: string }) {
  const [state, formAction, isPending] = useActionState(claimAccount, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-emerald-800 tracking-tight">
            Vault<span className="text-amber-500">lify</span>
          </Link>
          <h1 className="text-xl font-bold text-stone-900 mt-6 mb-1">Secure your account</h1>
          <p className="text-stone-500 text-sm">
            Set a password to fully claim your Vaultlify account and access your dashboard anytime.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 px-6 py-7 shadow-sm">
          {state?.message && !state.success && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-5">
              {state.message}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {token && <input type="hidden" name="claimToken" value={token} />}

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    state?.errors?.password ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {state?.errors?.password && (
                <p className="text-red-500 text-xs mt-1.5">{state.errors.password[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
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
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-emerald-100 active:scale-[0.98] mt-2"
            >
              {isPending ? "Setting up…" : "Set password & secure account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-400 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
