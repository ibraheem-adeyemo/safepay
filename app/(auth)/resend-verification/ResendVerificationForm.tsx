"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resendVerificationEmail } from "@/app/actions/auth";

export default function ResendVerificationForm() {
  const [state, formAction, isPending] = useActionState(resendVerificationEmail, undefined);
  const searchParams = useSearchParams();
  const emailHint = searchParams.get("email") ?? "";

  if (state?.message) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Check your inbox</h1>
        <p className="text-stone-500 text-sm mb-6 leading-relaxed">{state.message}</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6">
          Can&apos;t find it? Check your <strong>spam or junk folder</strong>.
        </div>
        <p className="text-sm text-stone-500">
          Already verified?{" "}
          <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Resend verification email</h1>
      <p className="text-stone-500 text-sm mb-6">
        Enter your email address and we&apos;ll send you a new verification link.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            defaultValue={emailHint}
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
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
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all text-sm"
        >
          {isPending ? "Sending…" : "Send verification link"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-500 mt-6">
        Remembered your password?{" "}
        <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
