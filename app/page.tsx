"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "buyer" | "seller" | "";

interface FormData {
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  role?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_SLOTS = 500;
const TAKEN_SLOTS = 347;
const REMAINING = TOTAL_SLOTS - TAKEN_SLOTS;

const HEADLINE_VARIANTS = [
  "Buy and Sell Online Without the Fear of Getting Scammed",
  "Your Money is Safe — Until You Get Exactly What You Paid For",
  "No More Praying After You Pay. We Hold the Money Until It's Done.",
];

const CTA_VARIANTS = [
  "Get Early Access — It's Free",
  "Secure My Spot Now",
  "Join the Waitlist → Start Transacting Safely",
];

const TRUST_STATS = [
  { value: "347", label: "People already on the waitlist" },
  { value: "₦0", label: "Cost to join early access" },
  { value: "100%", label: "Money-back if deal falls through" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create a Safe Transaction Link",
    desc: "Either the buyer or seller starts a transaction. You set the amount, describe what's being bought, and get a unique protected link.",
    icon: "🔗",
  },
  {
    step: "02",
    title: "Buyer Pays Into the Safe",
    desc: "The buyer sends payment — but the money doesn't go to the seller yet. It's held securely on our platform, like a digital safe deposit box.",
    icon: "💰",
  },
  {
    step: "03",
    title: "Seller Delivers the Goods",
    desc: "Now that payment is confirmed and secured, the seller delivers the item or service with confidence — knowing their money is waiting.",
    icon: "📦",
  },
  {
    step: "04",
    title: "Buyer Confirms Receipt",
    desc: "Once the buyer confirms they've received what they paid for, the funds are instantly released to the seller. Done. Clean. Safe.",
    icon: "✅",
  },
];

const TRUST_POINTS = [
  {
    title: "We never touch your money",
    desc: "Funds are held in a regulated escrow account — not our operating account. We can't spend it, we can't move it without both parties agreeing.",
    icon: "🏦",
  },
  {
    title: "Disputes are handled fairly",
    desc: "If there's a problem, our team reviews the evidence from both sides. We don't take sides — we follow the facts.",
    icon: "⚖️",
  },
  {
    title: "You're in control the whole time",
    desc: "You can see the status of your transaction at any time. Nothing happens without your knowledge or approval.",
    icon: "🎛️",
  },
  {
    title: "No account needed to get started",
    desc: "The person creating the transaction signs up. The other party just clicks the link — no registration required to pay or confirm.",
    icon: "⚡",
  },
];

const PAIN_CARDS = [
  {
    emoji: "😰",
    persona: "The Buyer's Fear",
    story:
      "You find a great deal on Instagram. The seller seems legit. You pay ₦85,000. They send a tracking number. You wait… and wait. Then — nothing. They've blocked you.",
    stat: "1 in 3 online buyers",
    statLabel: "has been scammed or knows someone who has",
  },
  {
    emoji: "😤",
    persona: "The Seller's Nightmare",
    story:
      "A buyer messages you on WhatsApp. You ship the product. You share the waybill number as proof. Then the buyer says they'll 'pay later' — and ghosts you completely.",
    stat: "68% of sellers",
    statLabel: "refuse bank transfers from strangers because of this exact fear",
  },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function CountdownTimer() {
  const [time, setTime] = useState({ hours: 23, minutes: 47, seconds: 12 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 0; minutes = 0; seconds = 0; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 text-sm font-mono">
      <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold text-xs">
        {pad(time.hours)}h
      </span>
      <span className="text-amber-600 font-bold">:</span>
      <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold text-xs">
        {pad(time.minutes)}m
      </span>
      <span className="text-amber-600 font-bold">:</span>
      <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold text-xs">
        {pad(time.seconds)}s
      </span>
    </div>
  );
}

function ProgressBar({ taken, total }: { taken: number; total: number }) {
  const pct = Math.round((taken / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-stone-500 mb-1.5">
        <span>{taken} spots taken</span>
        <span>{total - taken} remaining</span>
      </div>
      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Waitlist Modal ───────────────────────────────────────────────────────────

function WaitlistModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>({ name: "", email: "", role: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<"form" | "loading" | "success">("form");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setForm({ name: "", email: "", role: "" });
      setErrors({});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "We need your name to save your spot";
    if (!form.email.trim()) newErrors.email = "Email is required to send your confirmation";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Please enter a valid email address";
    if (!form.role) newErrors.role = "Tell us if you mostly buy or sell online";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setStep("loading");
    setTimeout(() => setStep("success"), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-emerald-800 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-300 text-xs font-semibold tracking-widest uppercase mb-1">
                Early Access · {REMAINING} spots left
              </p>
              <h3 className="text-white text-xl font-bold leading-tight">
                Secure your free spot
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-300 hover:text-white transition-colors text-2xl leading-none ml-4 mt-0.5"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <div className="mt-4">
            <ProgressBar taken={TAKEN_SLOTS} total={TOTAL_SLOTS} />
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6">
          {step === "form" && (
            <>
              <div className="space-y-4">
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
                      errors.name ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
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
                      errors.email ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    I mostly…
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["buyer", "seller"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setForm({ ...form, role: r });
                          if (errors.role) setErrors({ ...errors, role: undefined });
                        }}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          form.role === r
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                        }`}
                      >
                        {r === "buyer" ? "🛒 Buy online" : "📦 Sell online"}
                      </button>
                    ))}
                  </div>
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="mt-6 w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-emerald-200"
              >
                Save My Early Access Spot →
              </button>

              <p className="text-center text-xs text-stone-400 mt-3">
                No spam. No credit card. Just early access when we launch.
              </p>
            </>
          )}

          {step === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-stone-600 text-sm font-medium">Saving your spot…</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h4 className="text-xl font-bold text-stone-800 mb-2">
                You're in, {form.name.split(" ")[0]}!
              </h4>
              <p className="text-stone-600 text-sm leading-relaxed mb-6">
                We've reserved your early access spot. You'll be among the{" "}
                <strong>first people</strong> to use SafePay when we launch.
                We'll email you at{" "}
                <span className="text-emerald-700 font-medium">{form.email}</span> with
                everything you need.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 font-medium mb-6">
                📌 Your position: <strong>#{TAKEN_SLOTS + 1}</strong> on the waitlist
              </div>
              <p className="text-xs text-stone-400">
                Share with a friend who buys or sells online — they'll thank you later.
              </p>
              <button
                onClick={onClose}
                className="mt-4 text-sm text-stone-500 underline hover:text-stone-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openModal = () => setModalOpen(true);

  return (
    <>
      {/* ── Font import ── */}
      {/* <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #FAFAF7; color: #1c1917; }
        h1, h2, h3 { font-family: 'Lora', serif; }
        html { scroll-behavior: smooth; }
      `}</style> */}

      <WaitlistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── Urgency Banner ── */}
      <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium">
        <span className="opacity-90">🔥 Early access closes soon —</span>{" "}
        <strong>{REMAINING} free spots</strong> remaining today.{" "}
        <CountdownTimer />
      </div>

      {/* ── Navbar ── */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-white/95 shadow-sm backdrop-blur-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              SP
            </div>
            <span className="font-bold text-stone-800 text-lg" style={{ fontFamily: "Lora, serif" }}>
              SafePay
            </span>
          </div>
          <button
            onClick={openModal}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get Early Access
          </button>
        </div>
      </nav>

      <main>
        {/* ══════════════════════════════════════════════════════════════════
            1. HERO SECTION
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-emerald-900 text-white">
          {/* Background texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #34d399 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 40%)`,
            }}
          />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-600 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-200 font-medium">
                  Now accepting early users · Fintech · Protected Payments
                </span>
              </div>

              {/* Primary Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
                Buy and Sell Online{" "}
                <span className="text-amber-400">Without the Fear</span>{" "}
                of Getting Scammed
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-emerald-200 leading-relaxed mb-10 max-w-2xl">
                SafePay holds the buyer's money securely until the seller
                delivers. Nobody gets scammed. Nobody gets ghosted. You both
                get exactly what was promised — or your money comes back.
              </p>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={openModal}
                  className="bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-xl shadow-amber-900/30"
                >
                  Get Early Access — It's Free →
                </button>
                <a href="#how-it-works" className="border border-emerald-600 hover:border-emerald-400 text-emerald-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-all">
                  See how it works ↓
                </a>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-emerald-400">
                <span className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> No credit card needed
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Free to join waitlist
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Works on WhatsApp & Instagram
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl">
              {TRUST_STATS.map((stat) => (
                <div key={stat.label} className="border-l border-emerald-700 pl-4">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1" style={{ fontFamily: "Lora, serif" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-emerald-400 leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            2. PROBLEM SECTION
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-stone-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-3">
                The Problem
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                Online transactions are broken.<br className="hidden sm:block" />
                And everyone knows it.
              </h2>
              <p className="text-stone-600 text-lg max-w-2xl mx-auto">
                Whether you buy or sell on WhatsApp, Instagram, Telegram or Any Online market palce —
                you've felt this fear before.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {PAIN_CARDS.map((card) => (
                <div
                  key={card.persona}
                  className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm"
                >
                  <div className="text-4xl mb-4">{card.emoji}</div>
                  <h3 className="text-xl font-bold text-stone-800 mb-4">{card.persona}</h3>
                  <p className="text-stone-600 leading-relaxed mb-6 text-base italic border-l-4 border-red-200 pl-4">
                    "{card.story}"
                  </p>
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <span className="text-red-700 font-bold text-lg">{card.stat}</span>{" "}
                    <span className="text-red-600 text-sm">{card.statLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-stone-800 text-white rounded-2xl p-8 text-center">
              <p className="text-xl font-bold mb-2" style={{ fontFamily: "Lora, serif" }}>
                This isn't just your problem. It's everyone's problem.
              </p>
              <p className="text-stone-400 text-base">
                Billions of naira are lost every year to failed social commerce
                transactions. And the worst part? Most of it is completely
                preventable.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            3. SOLUTION SECTION
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">
                  The Solution
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-6 leading-tight">
                  A neutral third party that holds the money — until the deal is done.
                </h2>
                <p className="text-stone-600 text-lg leading-relaxed mb-6">
                  Think of SafePay as a trusted middleman that both the buyer
                  and seller agree to. The buyer's money goes into a secure
                  hold — and only gets released when both parties are happy.
                </p>
                <p className="text-stone-600 text-lg leading-relaxed mb-8">
                  No more trusting a stranger with your money. No more
                  delivering goods on a prayer. SafePay makes both sides safe —
                  at the same time.
                </p>
                <div className="space-y-3">
                  {[
                    "Works for physical goods, digital products & services",
                    "Generate a transaction link in under 2 minutes",
                    "Share it on any platform — WhatsApp, Telegram, DMs",
                    "Full dispute resolution if something goes wrong",
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 text-xs font-bold">✓</span>
                      </div>
                      <span className="text-stone-700 text-base">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual card */}
              <div className="relative">
                <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">SP</div>
                      <div>
                        <p className="text-xs text-stone-400">Transaction #SP-4821</p>
                        <p className="font-bold text-stone-800">iPhone 15 Pro Max</p>
                      </div>
                      <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full">In Progress</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Amount Held</span>
                        <span className="font-bold text-stone-800">₦950,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Buyer</span>
                        <span className="font-semibold text-stone-700">Tunde A. ✓</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Seller</span>
                        <span className="font-semibold text-stone-700">Chidi Electronics ✓</span>
                      </div>
                    </div>
                    <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "60%" }} />
                    </div>
                    <p className="text-xs text-stone-400 mt-1">Awaiting delivery confirmation</p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 bg-white rounded-xl p-4 border border-green-100 text-center">
                      <div className="text-2xl mb-1">🛡️</div>
                      <p className="text-xs font-semibold text-stone-700">Money Protected</p>
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 border border-blue-100 text-center">
                      <div className="text-2xl mb-1">📋</div>
                      <p className="text-xs font-semibold text-stone-700">Terms Agreed</p>
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 border border-amber-100 text-center">
                      <div className="text-2xl mb-1">⚡</div>
                      <p className="text-xs font-semibold text-stone-700">Instant Release</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            4. HOW IT WORKS
        ══════════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-stone-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">
                How It Works
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                4 steps. Both sides protected.
              </h2>
              <p className="text-stone-500 text-lg">
                No complicated forms. No branch visits. Just a link and a deal.
              </p>
            </div>

            <div className="relative">
              {/* Connector line (desktop) */}
              <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-200 to-transparent" style={{ margin: "0 12%" }} />

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="relative">
                    <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm h-full hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{step.icon}</span>
                        <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                          {step.step}
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-800 text-base mb-3 leading-snug">
                        {step.title}
                      </h3>
                      <p className="text-stone-500 text-sm leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="lg:hidden flex justify-center my-2 text-stone-300 text-2xl">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={openModal}
                className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg"
              >
                I'm In — Secure My Spot
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            5. TRUST & SAFETY SECTION
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">
                Why Trust SafePay
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                "How do I know you won't disappear with my money?"
              </h2>
              <p className="text-stone-500 text-lg max-w-2xl mx-auto">
                We expected that question. It's a fair one. Here's exactly how
                we protect both sides — and why we can't run off with your
                funds even if we wanted to.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 mb-16">
              {TRUST_POINTS.map((point) => (
                <div
                  key={point.title}
                  className="flex gap-5 p-6 rounded-2xl border border-stone-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
                >
                  <div className="text-3xl flex-shrink-0">{point.icon}</div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-base mb-2">{point.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Skeptic FAQ */}
            <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12">
              <h3 className="text-xl font-bold mb-8 text-center">
                Still have questions? Fair enough.
              </h3>
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  {
                    q: "What if the buyer lies about not receiving the goods?",
                    a: "We ask for proof — tracking numbers, photos, delivery confirmations. If there's a dispute, our team reviews real evidence. Liars don't win.",
                  },
                  {
                    q: "What if the seller delivers something broken or fake?",
                    a: "The buyer has a review window to inspect the goods before funds are released. If something's wrong, they raise a dispute and we investigate.",
                  },
                  {
                    q: "How long does the money stay in hold?",
                    a: "You and the seller agree on the inspection period upfront — typically 24 to 72 hours after delivery. It's written into the transaction.",
                  },
                  {
                    q: "Is this legal and regulated?",
                    a: "Yes. We operate under standard financial regulations for payment processing and escrow services in Nigeria. Full compliance, always.",
                  },
                ].map((item) => (
                  <div key={item.q}>
                    <p className="font-semibold text-emerald-300 text-sm mb-2">"{item.q}"</p>
                    <p className="text-emerald-200 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            6. EARLY ACCESS HOOK + FINAL CTA
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-amber-500">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-600/40 border border-amber-400 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm text-white font-semibold">
                Only {REMAINING} spots left in early access
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              The next time you buy or sell online —
              <br />
              <span className="text-amber-100">you shouldn't have to pray it works out.</span>
            </h2>

            <p className="text-amber-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join hundreds of buyers and sellers who are done gambling with
              their money on social commerce. Get in early — for free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={openModal}
                className="bg-white text-amber-700 hover:bg-amber-50 active:scale-[0.98] font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl"
              >
                Secure My Free Spot Now →
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-amber-100">
              <span className="flex items-center gap-2">
                <span>✓</span> Zero cost to join
              </span>
              <span className="flex items-center gap-2">
                <span>✓</span> No spam ever
              </span>
              <span className="flex items-center gap-2">
                <span>✓</span> First to use the product when we launch
              </span>
            </div>

            {/* Waitlist progress */}
            <div className="mt-12 bg-white/20 backdrop-blur rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-white font-semibold text-sm mb-3">
                Waitlist filling up fast
              </p>
              <ProgressBar taken={TAKEN_SLOTS} total={TOTAL_SLOTS} />
              <div className="flex justify-between text-xs text-amber-100 mt-3">
                <span>🟢 {TAKEN_SLOTS} joined today</span>
                <span>⏳ {REMAINING} spots left</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════════ */}
        <footer className="bg-stone-900 text-stone-400 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  SP
                </div>
                <div>
                  <p className="text-white font-bold" style={{ fontFamily: "Lora, serif" }}>SafePay</p>
                  <p className="text-stone-500 text-xs">Protected payments for everyone</p>
                </div>
              </div>
              <div className="flex gap-8 text-sm">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="mailto:hello@safepay.ng" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            <div className="border-t border-stone-800 mt-8 pt-8 text-center text-xs text-stone-600">
              <p>
                © {new Date().getFullYear()} SafePay Technologies Ltd. All rights reserved.
                Funds held in regulated escrow accounts.
              </p>
              <p className="mt-2">
                This is an early access sign-up page. The full product is currently in development.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}