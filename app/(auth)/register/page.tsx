"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { register } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, undefined);
  const [accountType, setAccountType] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Create your account</h1>
      <p className="text-stone-500 text-sm mb-6">
        Start protecting your transactions today
      </p>

      <form action={formAction} className="space-y-4">
        {/* Global error */}
        {state?.message && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {state.message}
          </div>
        )}

        {/* Account Type */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            I am a…
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["PERSONAL", "BUSINESS"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  accountType === type
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-stone-300 bg-stone-50 text-stone-600 hover:border-stone-400"
                }`}
              >
                {type === "PERSONAL" ? "👤 Individual" : "🏪 Business / SME"}
              </button>
            ))}
          </div>
          <input type="hidden" name="accountType" value={accountType} />
          {state?.errors?.accountType && (
            <p className="text-red-500 text-xs mt-1.5">
              {state.errors.accountType[0]}
            </p>
          )}
        </div>

        {/* Business Name — shown only for BUSINESS */}
        {accountType === "BUSINESS" && (
          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-semibold text-stone-700 mb-1.5"
            >
              Business name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              placeholder="e.g. Tunde Gadgets Store"
              className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                state?.errors?.businessName
                  ? "border-red-400 bg-red-50"
                  : "border-stone-300 bg-stone-50"
              }`}
            />
            {state?.errors?.businessName && (
              <p className="text-red-500 text-xs mt-1.5">
                {state.errors.businessName[0]}
              </p>
            )}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-stone-700 mb-1.5"
          >
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Tunde Adeyemi"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.name ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
            }`}
          />
          {state?.errors?.name && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.name[0]}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-stone-700 mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.email ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
            }`}
          />
          {state?.errors?.email && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.email[0]}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-stone-700 mb-1.5"
          >
            Phone number{" "}
            <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+2348012345678"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.phone ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
            }`}
          />
          {state?.errors?.phone && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.phone[0]}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-stone-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.password ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
            }`}
          />
          {state?.errors?.password && (
            <p className="text-red-500 text-xs mt-1.5">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all text-sm mt-2"
        >
          {isPending ? "Creating account…" : "Create account →"}
        </button>

        <p className="text-xs text-stone-400 text-center">
          By creating an account, you agree to our terms of service.
        </p>
      </form>

      <p className="text-center text-sm text-stone-500 mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-emerald-700 font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
