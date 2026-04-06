"use client"

import { HOW_IT_WORKS, PAIN_CARDS, TRUST_POINTS, TRUST_STATS, WEEK_SLOTS, WEEK_TAKEN } from "@/src/contants";
import { CountdownTimer } from "@/src/features/components/CountdownTimer";
import { ProgressBar } from "@/src/features/components/ProgressBar";
import WhatsappBtn from "@/src/features/components/WhatsappBtn";
import { TransactionModal } from "@/src/features/modals/transactionModsal";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);
  const open = () => setModalOpen(true);
 
  const buyerMessage = "Hi, I want to BUY something using SafePay"

  const sellerMessage = "Hi, I want to SELL something using SafePay"

  const generalMessage = "Hi, I want to use SafePay for a transaction"

  const whatsAppNumber = "+2347013331995"

  return (
    <>
      {/* <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #FAFAF7; color: #1c1917; -webkit-font-smoothing: antialiased; }
        h1, h2, h3, h4 { font-family: 'Lora', serif; }
        html { scroll-behavior: smooth; }
      `}</style> */}
 
      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
 
      {/* ── Urgency Banner ── */}
      <div className="bg-stone-900 text-white text-center py-2.5 px-4">
        <p className="text-sm">
          <span className="text-amber-400 font-bold">⚡ Only {WEEK_SLOTS - WEEK_TAKEN} manual escrow slots left this week</span>
          {" "}— our team is personally handling first transactions.{" "}
          <span className="text-white/50">Resets in <CountdownTimer /></span>
        </p>
      </div>
 
      {/* ── Navbar ── */}
      <nav className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-transparent"}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">SP</div>
            <span className="font-bold text-stone-800 text-lg" style={{ fontFamily: "Lora, serif" }}>SafePay</span>
          </div>
          <button onClick={open} className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Create Transaction
          </button>
        </div>
      </nav>
 
      <main>
        {/* ════════ HERO ════════ */}
        <section className="relative overflow-hidden bg-emerald-900 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #34d399 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 40%)" }} />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-600 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-200 font-medium">Manually securing transactions now · {WEEK_SLOTS - WEEK_TAKEN} slots left this week</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
                Buy and Sell Online{" "}<span className="text-amber-400">Without the Fear</span>{" "}of Getting Scammed
              </h1>
              <p className="text-lg sm:text-xl text-emerald-200 leading-relaxed mb-10 max-w-2xl">
                SafePay holds the buyer's money in a protected escrow until the seller delivers.<br /> If the seller disappears, you get your money back. <br /> No more delivering on a promise that vanishes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button onClick={open} className="bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-xl shadow-amber-900/30">
                  Create a Safe Transaction →
                </button>
                <a href="#how-it-works" className="border border-emerald-600 hover:border-emerald-400 text-emerald-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-all text-center">
                  See how it works ↓
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-emerald-400">
                <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Works on WhatsApp & Instagram</span>
                <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Free to create</span>
                <span className="flex items-center gap-2"><span className="text-green-400">✓</span> No account needed to pay</span>
              </div>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="border-l border-emerald-700 pl-4">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1" style={{ fontFamily: "Lora, serif" }}>{s.value}</div>
                  <div className="text-xs text-emerald-400 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <WhatsappBtn phoneNumber={whatsAppNumber} preMessage={encodeURIComponent(generalMessage)} chatBtnCont={generalMessage} />

        <WhatsappBtn phoneNumber={whatsAppNumber} preMessage={encodeURIComponent(buyerMessage)} chatBtnCont={buyerMessage} bottomPosition={"bottom-20"} />     
        <WhatsappBtn phoneNumber={whatsAppNumber} preMessage={encodeURIComponent(sellerMessage)} chatBtnCont={sellerMessage} bottomPosition={"bottom-35"} />

        {/* ════════ PROBLEM ════════ */}
        <section className="py-20 sm:py-28 bg-stone-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-3">The Problem</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">Online transactions are broken.<br className="hidden sm:block" /> And everyone knows it.</h2>
              <p className="text-stone-600 text-lg max-w-2xl mx-auto">Whether you buy or sell on WhatsApp, Instagram, or Telegram — you've felt this fear before.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {PAIN_CARDS.map((c) => (
                <div key={c.persona} className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
                  <div className="text-4xl mb-4">{c.emoji}</div>
                  <h3 className="text-xl font-bold text-stone-800 mb-4">{c.persona}</h3>
                  <p className="text-stone-600 leading-relaxed mb-6 text-base italic border-l-4 border-red-200 pl-4">{
                    c.story.map((itm, i) => (
                      <div key={i} className="flex">
                        <div className="w-10 h-10 border-r-[50%]"></div>
                        <div>{itm}</div>
                      </div>
                    ))
                    }</p>
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <span className="text-red-700 font-bold text-lg">{c.stat}</span>{" "}<span className="text-red-600 text-sm">{c.statLabel}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 bg-stone-800 text-white rounded-2xl p-8 text-center">
              <p className="text-xl font-bold mb-2" style={{ fontFamily: "Lora, serif" }}>This isn't just your problem. It's everyone's problem.</p>
              <p className="text-stone-400 text-base">Billions of naira lost every year to failed social commerce transactions. Most of it completely preventable.</p>
            </div>
          </div>
        </section>
 
        {/* ════════ MANUAL ESCROW — "We can do this TODAY" ════════ */}
        <section className="py-20 sm:py-24 bg-amber-50 border-y border-amber-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 rounded-full px-4 py-1.5 mb-6">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" /><span className="text-sm text-amber-700 font-semibold">Available right now</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-5 leading-tight">
                  We can manually secure your transaction — today.
                </h2>
                <p className="text-stone-600 text-lg leading-relaxed mb-5">
                  Our platform is in early access, but that doesn't mean you have to wait. While we build the full product, our team is <strong>personally handling transactions</strong> for our first users.
                </p>
                <p className="text-stone-600 text-lg leading-relaxed mb-8">
                  You describe the deal. We verify both parties. We hold the funds. We release when both sides confirm. Human-powered escrow — while the tech catches up.
                </p>
                <div className="space-y-3 mb-8">
                  {["Response within 4 hours on weekdays", "WhatsApp + email confirmation for both parties", "Full transaction record sent to buyer and seller", "Dispute support if anything goes wrong"].map((p) => (
                    <div key={p} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-amber-800 text-xs font-bold">✓</span></div>
                      <span className="text-stone-700 text-base">{p}</span>
                    </div>
                  ))}
                </div>
                <button onClick={open} className="bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg">
                  Start My Transaction Now →
                </button>
              </div>
 
              <div className="space-y-4">
                {/* Urgency meter */}
                <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4">This week's manual slots</p>
                  <ProgressBar taken={WEEK_TAKEN} total={WEEK_SLOTS} />
                  <p className="text-stone-600 text-sm mt-4 leading-relaxed">
                    We limit manual transactions so each one gets proper attention.{" "}
                    <strong>{WEEK_SLOTS - WEEK_TAKEN} slots remain</strong> this week. Once they're gone, you'll be waitlisted for next week.
                  </p>
                </div>
                {/* Live transaction feed */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Recent manual transactions</p>
                  <div className="space-y-3">
                    {[
                      { item: "MacBook Air M2",       amount: "₦950,000", role: "Buyer protected",  time: "2 hrs ago" },
                      { item: "Aso-Oke fabric set",   amount: "₦65,000",  role: "Seller protected", time: "5 hrs ago" },
                      { item: "Logo design package",  amount: "₦40,000",  role: "Buyer protected",  time: "Yesterday" },
                      { item: "Samsung Galaxy S24",   amount: "₦550,000", role: "Both protected",   time: "Yesterday" },
                    ].map((t) => (
                      <div key={t.item} className="flex items-center justify-between text-sm py-2 border-b border-stone-100 last:border-0">
                        <div>
                          <p className="font-semibold text-stone-800">{t.item}</p>
                          <p className="text-xs text-emerald-600">{t.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-stone-700">{t.amount}</p>
                          <p className="text-xs text-stone-400">{t.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
 
        {/* ════════ HOW IT WORKS ════════ */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">4 steps. Both sides protected.</h2>
              <p className="text-stone-500 text-lg">No branch visits. No complicated forms. Just a link and a deal.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={s.step}>
                  <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 h-full hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{s.icon}</span>
                      <span className="text-xs font-bold text-stone-400 bg-stone-200 px-2 py-1 rounded-full">{s.step}</span>
                    </div>
                    <h3 className="font-bold text-stone-800 text-base mb-3 leading-snug">{s.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && <div className="lg:hidden flex justify-center my-2 text-stone-300 text-2xl">↓</div>}
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button onClick={open} className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg">
                Try It — Create a Transaction →
              </button>
            </div>
          </div>
        </section>
 
        {/* ════════ TRUST ════════ */}
        <section className="py-20 sm:py-28 bg-stone-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">Why Trust SafePay</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">"How do I know you won't disappear with my money?"</h2>
              <p className="text-stone-500 text-lg max-w-2xl mx-auto">We expected that question. Here's exactly why we can't run off with your funds even if we wanted to.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 mb-14">
              {TRUST_POINTS.map((p) => (
                <div key={p.title} className="flex gap-5 p-6 rounded-2xl border border-stone-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                  <div className="text-3xl flex-shrink-0">{p.icon}</div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-base mb-2">{p.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12">
              <h3 className="text-xl font-bold mb-8 text-center">Still have questions? Fair enough.</h3>
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  { q: "What if the buyer lies about not receiving the goods?", a: "We ask for proof — tracking numbers, photos, delivery confirmations. Our team reviews real evidence. Liars don't win." },
                  { q: "What if the seller delivers something broken or fake?",  a: "The buyer has an inspection window before funds release. If something's wrong, they raise a dispute and we investigate." },
                  { q: "How long does the money stay in hold?",                 a: "You agree on the inspection period upfront — typically 24–72 hours after delivery. It's written into every transaction." },
                  { q: "Is this legal and regulated?",                          a: "Yes. We operate under Nigerian financial regulations for payment processing and escrow services. Full compliance, always." },
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
 
        {/* ════════ FINAL CTA ════════ */}
        <section className="py-20 sm:py-28 bg-amber-500">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-600/40 border border-amber-400 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm text-white font-semibold">Only {WEEK_SLOTS - WEEK_TAKEN} manual slots left this week</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              The next time you buy or sell online —<br /><span className="text-amber-100">you shouldn't have to pray it works out.</span>
            </h2>
            <p className="text-amber-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Create a protected transaction right now. Our team will personally handle your first deal — so you see exactly how it works.
            </p>
            <button onClick={open} className="bg-white text-amber-700 hover:bg-amber-50 active:scale-[0.98] font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl mb-6">
              Create My First Safe Transaction →
            </button>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-amber-100 mb-12">
              <span>✓ Free to start</span><span>✓ Human support for first deal</span><span>✓ Both sides protected</span>
            </div>
            <div className="bg-white/20 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-white font-semibold text-sm mb-3">Weekly manual slots</p>
              <ProgressBar taken={WEEK_TAKEN} total={WEEK_SLOTS} light />
              <div className="flex justify-between text-xs text-amber-100 mt-3">
                <span>🟢 {WEEK_TAKEN} secured this week</span><span>⏳ {WEEK_SLOTS - WEEK_TAKEN} left</span>
              </div>
            </div>
          </div>
        </section>
 
        {/* ════════ FOOTER ════════ */}
        <footer className="bg-stone-900 text-stone-400 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">SP</div>
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
              <p>© {new Date().getFullYear()} SafePay Technologies Ltd. All rights reserved. Funds held in regulated escrow accounts.</p>
              <p className="mt-2">This is an early access product. Manual transaction processing is available for verified early users.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}