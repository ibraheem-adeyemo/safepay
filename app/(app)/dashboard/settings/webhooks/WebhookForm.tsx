"use client";

import { useActionState, useState } from "react";
import { addWebhook } from "@/app/actions/account";

const ALL_EVENTS = [
  { value: "transaction.created", label: "Transaction created" },
  { value: "transaction.funded", label: "Transaction funded" },
  { value: "transaction.delivered", label: "Marked as delivered" },
  { value: "transaction.completed", label: "Transaction completed" },
  { value: "transaction.disputed", label: "Dispute raised" },
  { value: "transaction.cancelled", label: "Transaction cancelled" },
  { value: "payment.confirmed", label: "Payment confirmed" },
  { value: "dispute.resolved", label: "Dispute resolved" },
];

export default function WebhookForm() {
  const [state, formAction, isPending] = useActionState(addWebhook, undefined);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-semibold">
          {state.message}
        </div>
      )}
      {state?.message && !state.success && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Endpoint URL</label>
        <input
          name="url"
          type="url"
          placeholder="https://your-server.com/webhooks/vaultlify"
          className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            state?.errors?.url ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
          }`}
        />
        {state?.errors?.url && (
          <p className="text-red-500 text-xs mt-1.5">{state.errors.url[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-2">Events to subscribe</label>
        {state?.errors?.events && (
          <p className="text-red-500 text-xs mb-2">{state.errors.events[0]}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {ALL_EVENTS.map((evt) => (
            <label
              key={evt.value}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-colors ${
                selected.includes(evt.value)
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              <input
                type="checkbox"
                name="events"
                value={evt.value}
                checked={selected.includes(evt.value)}
                onChange={() => toggle(evt.value)}
                className="sr-only"
              />
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  selected.includes(evt.value)
                    ? "bg-emerald-600 border-emerald-600"
                    : "border-stone-300"
                }`}
              >
                {selected.includes(evt.value) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {evt.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
      >
        {isPending ? "Adding…" : "Add webhook"}
      </button>
    </form>
  );
}
