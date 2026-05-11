"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createTransaction } from "@/app/actions/transaction";

export default function NewTransactionPage() {
  const [state, formAction, isPending] = useActionState(createTransaction, undefined);
  const [role, setRole] = useState<"BUYER" | "SELLER" | "">("");
  const [amount, setAmount] = useState("");

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setAmount(raw ? Number(raw).toLocaleString("en-NG") : "");
  }

  const amountRaw = amount.replace(/,/g, "");
  const feeEstimate = amountRaw ? ((Number(amountRaw) * 1.5) / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 }) : null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
      >
        ← Transactions
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-800 px-6 py-5">
          <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-1">
            New Escrow Transaction
          </p>
          <h1 className="text-white text-xl font-bold">Protect your deal</h1>
          <p className="text-emerald-200 text-sm mt-1">
            Fill in the details below. We&apos;ll generate a secure link to share with the other party.
          </p>
        </div>

        <form action={formAction} className="px-6 py-6 space-y-5">
          {state?.message && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {state.message}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              What are you buying or selling?
            </label>
            <input
              name="title"
              type="text"
              placeholder="e.g. iPhone 15 Pro, Ankara fabric, Website design…"
              className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                state?.errors?.title ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
              }`}
            />
            {state?.errors?.title && (
              <p className="text-red-500 text-xs mt-1.5">{state.errors.title[0]}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Description{" "}
              <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="description"
              placeholder="Any extra details about the item or deal…"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50 text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Transaction amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm select-none">
                ₦
              </span>
              <input
                name="amount"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 150,000"
                value={amount}
                onChange={handleAmountChange}
                className={`w-full pl-8 pr-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  state?.errors?.amount ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
                }`}
              />
            </div>
            {feeEstimate && (
              <p className="text-xs text-stone-400 mt-1.5">
                Estimated SafePay fee: <span className="font-semibold text-stone-600">₦{feeEstimate}</span> (1.5%)
              </p>
            )}
            {state?.errors?.amount && (
              <p className="text-red-500 text-xs mt-1.5">{state.errors.amount[0]}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              In this deal, you are the…
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["BUYER", "SELLER"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                    role === r
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200"
                      : "border-stone-300 bg-stone-50 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  {r === "BUYER" ? "🛒 Buyer" : "📦 Seller"}
                  <p className="text-xs font-normal mt-0.5 opacity-70">
                    {r === "BUYER" ? "I'm paying for this" : "I'm delivering this"}
                  </p>
                </button>
              ))}
            </div>
            <input type="hidden" name="role" value={role} />
            {state?.errors?.role && (
              <p className="text-red-500 text-xs mt-1.5">{state.errors.role[0]}</p>
            )}
          </div>

          {/* Preview */}
          {(amount || role) && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-2">
                Transaction preview
              </p>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-800 text-sm">
                    {(document.querySelector("[name=title]") as HTMLInputElement)?.value || "—"}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    You are the {role || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-700">{amount ? `₦${amount}` : "—"}</p>
                  <p className="text-xs text-emerald-500">🛡 SafePay escrow</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !role}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-100 mt-2"
          >
            {isPending ? "Creating transaction…" : "Generate Secure Link →"}
          </button>
          <p className="text-center text-xs text-stone-400">
            A shareable link will be created. Both parties are protected from day one.
          </p>
        </form>
      </div>
    </div>
  );
}
