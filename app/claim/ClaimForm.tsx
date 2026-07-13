"use client";

import { useActionState } from "react";
import Link from "next/link";
import { claimAccount } from "@/app/actions/account";

export default function ClaimForm({ token }: { token?: string }) {
  const [state, formAction, isPending] = useActionState(claimAccount, undefined);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-emerald-800 tracking-tight">
            Safe<span className="text-amber-500">Pay</span>
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
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                  state?.errors?.password ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
                }`}
              />
              {state?.errors?.password && (
                <p className="text-red-500 text-xs mt-1.5">{state.errors.password[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Confirm password
              </label>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
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
