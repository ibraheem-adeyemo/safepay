"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const emailHint = searchParams.get("email") ?? "";
  const fromWidget = searchParams.get("hint") === "widget";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Welcome back</h1>
      <p className="text-stone-500 text-sm mb-6">Sign in to your SafePay account</p>

      {fromWidget && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-4">
          You already have a SafePay account with this email. Sign in to accept the transaction.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {state?.message && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {state.message}
          </div>
        )}

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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-semibold text-stone-700">
              Password
            </label>
            <Link
              href={emailHint ? `/claim/reset?email=${encodeURIComponent(emailHint)}` : "/claim/reset"}
              className="text-xs text-emerald-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.password ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
            }`}
          />
          {state?.errors?.password && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.password[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all text-sm mt-2"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-emerald-700 font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
