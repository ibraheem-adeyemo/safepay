"use client";

import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE FORM CONFIGURATION
//
// HOW TO GET YOUR ENTRY IDs:
// 1. Open your Google Form in a browser
// 2. Right-click → "View Page Source" (or open DevTools → Network tab)
// 3. Submit a test response while watching the Network tab
// 4. Look for a POST to "formResponse" — the payload shows entry.XXXXXXXXX keys
//
// OR: Open the form, right-click each field → Inspect → find data-params
// attribute containing the entry ID number.
//
// Replace ALL values below before going live.
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_FORM_CONFIG = {
  // The form action URL — replace XXXXXXXXXXXXXXXX with your Form ID
  // Found in: https://docs.google.com/forms/d/XXXXXXXXXXXXXXXX/viewform
  actionUrl:process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || '',

  fields: {
    // Replace each entry.XXXXXXXXX with your actual field entry IDs
    name: "entry.574737166",
    email: "entry.255390180",
    role: "entry.1246998561",          // values: "Buyer" or "Seller"
    scammed: "entry.661672358",       // values: "Yes" or "No"
    transactionAmount: "entry.598697133", // optional — amount as string
    itemName: "entry.111764373", // optional — amount as string
    itemImage: "entry.1934297095" //optional item image
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_SLOTS = 500;
const TAKEN_SLOTS = 347;
const REMAINING = TOTAL_SLOTS - TAKEN_SLOTS;

const AMOUNT_RANGES = [
  { label: "Under ₦10k", value: "Under ₦10,000" },
  { label: "₦10k – ₦50k", value: "₦10,000 – ₦50,000" },
  { label: "₦50k – ₦200k", value: "₦50,000 – ₦200,000" },
  { label: "₦200k – ₦500k", value: "₦200,000 – ₦500,000" },
  { label: "Over ₦500k", value: "Over ₦500,000" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Role = "Buyer" | "Seller" | "";
type Scammed = "Yes" | "No" | "";

interface FormData {
  name: string;
  email: string;
  role: Role;
  scammed: Scammed;
  transactionAmount: string; // optional
  itemName: string;
  itemImage?: string
}

interface FormErrors {
  name?: string;
  email?: string;
  role?: string;
  scammed?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ taken, total }: { taken: number; total: number }) {
  const pct = Math.round((taken / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-emerald-300 mb-1.5">
        <span>{taken} spots taken</span>
        <span>{total - taken} remaining</span>
      </div>
      <div className="h-1.5 bg-emerald-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface ChoiceButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: "emerald" | "red" | "amber";
}

function ChoiceButton({
  selected,
  onClick,
  children,
  accent = "emerald",
}: ChoiceButtonProps) {
  const accents = {
    emerald: selected
      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
      : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:bg-emerald-50/40",
    red: selected
      ? "border-red-400 bg-red-50 text-red-800"
      : "border-stone-200 bg-white text-stone-600 hover:border-red-200 hover:bg-red-50/40",
    amber: selected
      ? "border-amber-400 bg-amber-50 text-amber-800"
      : "border-stone-200 bg-white text-stone-600 hover:border-amber-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.97] ${accents[accent]}`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────
export function WaitlistModal({
  isOpen,
  onClose,
  transactionData,
}: {
  isOpen: boolean;
  onClose: () => void;
  transactionData: {item: string; amount: string}|null
}) {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    role: "",
    scammed: "",
    transactionAmount: "",
    itemName: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<"form" | "submitting" | "success" | "error">(
    "form"
  );
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setForm({ name: "", email: "", role: "", scammed: "", transactionAmount: "", itemName: "" });
      setErrors({});
      setSubmitError("");
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "submitting") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, step]);

  // Validation — only required fields
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim())
      newErrors.name = "We need your name to save your spot";
    if (!form.email.trim())
      newErrors.email = "Email is required to send your confirmation";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Please enter a valid email address";
    if (!form.role)
      newErrors.role = "Let us know if you mostly buy or sell online";
    if (!form.scammed)
      newErrors.scammed = "This helps us understand your experience";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (!validate()) return;

  setStep("submitting");

  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      setStep("success");
    } else {
      throw new Error("Failed");
    }
  } catch (err) {
    setStep("error");
  }
};

//   const handleSubmit = async () => {
//     if (!validate()) return;
//     setStep("submitting");
//     setSubmitError("");

//     try {
//       await submitToGoogleForms();
//       setStep("success");
//     } catch (err) {
//       console.error("Form submission error:", err);
//       setSubmitError(
//         "Something went wrong. Please try again or email us directly."
//       );
//       setStep("error");
//     }
//   };

  if (!isOpen) return null;

  const firstName = form.name.trim().split(" ")[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "submitting") onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">

        {/* ── Header ── */}
        <div className="bg-emerald-800 px-6 py-5 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-300 text-xs font-semibold tracking-widest uppercase mb-1">
                Early Access · {REMAINING} spots left
              </p>
              <h3 className="text-white text-xl font-bold leading-tight">
                Secure your free spot
              </h3>
            </div>
            {step !== "submitting" && (
              <button
                onClick={onClose}
                className="text-emerald-400 hover:text-white transition-colors text-2xl leading-none ml-4 mt-0.5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-700"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
          <div className="mt-4">
            <ProgressBar taken={TAKEN_SLOTS} total={TOTAL_SLOTS} />
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="px-6 py-6 overflow-y-auto flex-1">

          {/* ════ FORM STEP ════ */}
          {step === "form" && (
            <>
              <div className="space-y-5">

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    Your first name
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="e.g. Amaka"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm transition-colors outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.name
                        ? "border-red-400 bg-red-50"
                        : "border-stone-300 bg-stone-50"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span>⚠</span> {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm transition-colors outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.email
                        ? "border-red-400 bg-red-50"
                        : "border-stone-300 bg-stone-50"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span>⚠</span> {errors.email}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    I mostly…
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceButton
                      selected={form.role === "Buyer"}
                      onClick={() => {
                        setForm({ ...form, role: "Buyer" });
                        if (errors.role) setErrors({ ...errors, role: undefined });
                      }}
                    >
                      🛒 Buy online
                    </ChoiceButton>
                    <ChoiceButton
                      selected={form.role === "Seller"}
                      onClick={() => {
                        setForm({ ...form, role: "Seller" });
                        if (errors.role) setErrors({ ...errors, role: undefined });
                      }}
                    >
                      📦 Sell online
                    </ChoiceButton>
                  </div>
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span>⚠</span> {errors.role}
                    </p>
                  )}
                </div>

                {/* Scammed before? */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">
                    Have you been scammed in an online transaction before?
                  </label>
                  <p className="text-xs text-stone-400 mb-2">
                    No judgement — this helps us understand how big the problem really is.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceButton
                      selected={form.scammed === "Yes"}
                      onClick={() => {
                        setForm({ ...form, scammed: "Yes" });
                        if (errors.scammed)
                          setErrors({ ...errors, scammed: undefined });
                      }}
                      accent="red"
                    >
                      😞 Yes, I have
                    </ChoiceButton>
                    <ChoiceButton
                      selected={form.scammed === "No"}
                      onClick={() => {
                        setForm({ ...form, scammed: "No" });
                        if (errors.scammed)
                          setErrors({ ...errors, scammed: undefined });
                      }}
                      accent="emerald"
                    >
                      🙏 No, not yet
                    </ChoiceButton>
                  </div>
                  {errors.scammed && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span>⚠</span> {errors.scammed}
                    </p>
                  )}
                </div>

                  {transactionData && (
  <div className="bg-green-50 p-3 rounded mb-4 text-sm">
    Transaction: {transactionData.item}  
    Amount: ₦{transactionData.amount}
  </div>
)}
                {/* Transaction Amount — optional */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">
                    Typical transaction size?{" "}
                    <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-xs text-stone-400 mb-2">
                    Helps us build the right product for how you actually transact.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AMOUNT_RANGES.map((range) => (
                      <button
                        key={range.value}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            transactionAmount:
                              form.transactionAmount === range.value
                                ? "" // toggle off
                                : range.value,
                          })
                        }
                        className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
                          form.transactionAmount === range.value
                            ? "border-amber-500 bg-amber-50 text-amber-800"
                            : "border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50/50"
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="mt-7 w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-emerald-100"
              >
                Save My Early Access Spot →
              </button>

              <p className="text-center text-xs text-stone-400 mt-3">
                No spam. No credit card. Just early access when we launch.
              </p>
            </>
          )}

          {/* ════ SUBMITTING STEP ════ */}
          {step === "submitting" && (
            <div className="py-14 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-stone-600 text-sm font-medium">Saving your spot…</p>
            </div>
          )}

          {/* ════ SUCCESS STEP ════ */}
          {step === "success" && (
            <div className="py-6 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h4 className="text-xl font-bold text-stone-800 mb-2">
                You're in{firstName ? `, ${firstName}` : ""}!
              </h4>
              <p className="text-stone-600 text-sm leading-relaxed mb-6">
                We've reserved your early access spot. You'll be among the{" "}
                <strong>first people</strong> to use SafePay when we launch.
                We'll email you at{" "}
                <span className="text-emerald-700 font-medium">{form.email}</span>{" "}
                with everything you need.
              </p>

              {/* Summary of what they submitted */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 text-sm text-left mb-5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Role</span>
                  <span className="font-semibold text-stone-700">
                    {form.role === "Buyer" ? "🛒 Buyer" : "📦 Seller"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Been scammed before?</span>
                  <span
                    className={`font-semibold ${
                      form.scammed === "Yes" ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {form.scammed}
                  </span>
                </div>
                {form.transactionAmount && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Typical deal size</span>
                    <span className="font-semibold text-stone-700">
                      {form.transactionAmount}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 font-medium mb-5">
                📌 Your position:{" "}
                <strong>#{TAKEN_SLOTS + 1}</strong> on the waitlist
              </div>

              <p className="text-xs text-stone-400 mb-4">
                Know a buyer or seller who's been burned before? Share this with
                them — they'll thank you later.
              </p>

              <button
                onClick={onClose}
                className="text-sm text-stone-400 underline hover:text-stone-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* ════ ERROR STEP ════ */}
          {step === "error" && (
            <div className="py-10 text-center">
              <div className="text-4xl mb-4">😔</div>
              <h4 className="text-lg font-bold text-stone-800 mb-2">
                Something went wrong
              </h4>
              <p className="text-stone-500 text-sm mb-6">{submitError}</p>
              <button
                onClick={() => setStep("form")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}