"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, resetPassword } from "@/app/actions/account";

type ActionState = { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined;

// ── Step 1: enter email to receive reset link ─────────────────────────────────

function RequestForm({ emailHint }: { emailHint?: string }) {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset as (s: ActionState, f: FormData) => Promise<ActionState>,
    undefined
  );

  if (state?.success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-6 text-center">
        <p className="text-2xl mb-2">📬</p>
        <p className="font-bold text-emerald-800 text-sm">Check your inbox</p>
        <p className="text-emerald-700 text-xs mt-1">{state.message}</p>
        <Link href="/login" className="block mt-4 text-xs text-emerald-700 font-semibold hover:underline">
          Back to sign in →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
          Email address
        </label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          defaultValue={emailHint ?? ""}
          className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
            state?.errors?.email ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
          }`}
        />
        {state?.errors?.email && (
          <p className="text-red-500 text-xs mt-1.5">{state.errors.email[0]}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all text-sm"
      >
        {isPending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

// ── Step 2: set new password using token from email ───────────────────────────

function ResetTokenForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPassword as (s: ActionState, f: FormData) => Promise<ActionState>,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="resetToken" value={token} />

      {state?.message && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.message}{" "}
          <Link href="/claim/reset" className="font-semibold underline">
            Request a new link
          </Link>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">New password</label>
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
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Confirm password</label>
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
        className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all text-sm"
      >
        {isPending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export default function ResetForm({ token, emailHint }: { token?: string; emailHint?: string }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-emerald-800 tracking-tight">
            Safe<span className="text-amber-500">Pay</span>
          </Link>
          <h1 className="text-xl font-bold text-stone-900 mt-6 mb-1">
            {token ? "Set a new password" : "Reset your password"}
          </h1>
          <p className="text-stone-500 text-sm">
            {token
              ? "Choose a new password for your Vaultlify account."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 px-6 py-7 shadow-sm">
          {token ? <ResetTokenForm token={token} /> : <RequestForm emailHint={emailHint} />}
        </div>

        <p className="text-center text-xs text-stone-400 mt-4">
          Remembered your password?{" "}
          <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
