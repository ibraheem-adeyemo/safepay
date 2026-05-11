"use client";

import { useActionState } from "react";
import { updateBusinessProfile } from "@/app/actions/account";

type Props = {
  currentName: string;
  currentDescription: string;
  currentWebsite: string;
};

export default function BusinessProfileForm({ currentName, currentDescription, currentWebsite }: Props) {
  const [state, formAction, isPending] = useActionState(updateBusinessProfile, undefined);

  return (
    <>
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
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Business name</label>
          <input
            name="name"
            type="text"
            defaultValue={currentName}
            placeholder="Acme Corp Ltd"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.name ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
            }`}
          />
          {state?.errors?.name && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Description <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="description"
            defaultValue={currentDescription}
            rows={3}
            placeholder="What does your business do?"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Website <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <input
            name="website"
            type="url"
            defaultValue={currentWebsite}
            placeholder="https://example.com"
            className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              state?.errors?.website ? "border-red-400 bg-red-50" : "border-stone-200 bg-stone-50"
            }`}
          />
          {state?.errors?.website && (
            <p className="text-red-500 text-xs mt-1.5">{state.errors.website[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
        >
          {isPending ? "Saving…" : "Save business profile"}
        </button>
      </form>
    </>
  );
}
