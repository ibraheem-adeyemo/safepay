import Link from "next/link";
import { HOW_IT_WORKS, PAIN_CARDS, TRUST_POINTS } from "@/src/contants";

const STATS = [
  { value: "₦0",   label: "Cost to create a transaction" },
  { value: "100%", label: "Money-back if deal falls through" },
  { value: "60s",  label: "Time to start your first escrow" },
];

const FEATURES = [
  {
    icon: "🖥️",
    title: "Personal Dashboard",
    desc: "Create transactions, track their status in real time, manage disputes, and get notified at every step — all from one clean dashboard.",
    badge: "Web app",
  },
  {
    icon: "⚡",
    title: "REST API",
    desc: "Integrate Vaultlify escrow directly into your marketplace or product. Full API with API key auth, webhook events, and invite-link generation.",
    badge: "For developers",
  },
  {
    icon: "🔲",
    title: "Embeddable Widget",
    desc: "Drop Vaultlify into your site with a single `<iframe>`. Your users never leave your product — the full escrow flow happens inside the widget.",
    badge: "No-code embed",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-black">VL</div>
            <span className="font-black text-stone-800 text-lg tracking-tight">
              Vault<span className="text-emerald-700">lify</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-stone-500">
            <a href="#how-it-works" className="hover:text-stone-800 transition-colors">How it works</a>
            <a href="#for-businesses" className="hover:text-stone-800 transition-colors">For businesses</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-stone-600 hover:text-stone-800 transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link href="/register" className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
              Get Started →
            </Link>
          </div>
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
                <span className="text-sm text-emerald-200 font-medium">Live and open — start your first transaction in 60 seconds</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
                Buy and Sell Online{" "}
                <span className="text-amber-400">Without the Fear</span>{" "}
                of Getting Scammed
              </h1>
              <p className="text-lg sm:text-xl text-emerald-200 leading-relaxed mb-10 max-w-2xl">
                Vaultlify holds the buyer's money in a protected escrow until the seller delivers.
                If the seller disappears, you get your money back.
                No more delivering on a promise that vanishes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/register" className="inline-block bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-xl shadow-amber-900/30 text-center">
                  Create a Safe Transaction →
                </Link>
                <a href="#how-it-works" className="inline-block border border-emerald-600 hover:border-emerald-400 text-emerald-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-all text-center">
                  See how it works ↓
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-emerald-400">
                <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Works on WhatsApp &amp; Instagram deals</span>
                <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Free to create</span>
                <span className="flex items-center gap-2"><span className="text-green-400">✓</span> No account needed to accept</span>
              </div>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl">
              {STATS.map((s) => (
                <div key={s.label} className="border-l border-emerald-700 pl-4">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{s.value}</div>
                  <div className="text-xs text-emerald-400 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ PROBLEM ════════ */}
        <section className="py-20 sm:py-28 bg-stone-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-3">The Problem</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                Online transactions are broken.<br className="hidden sm:block" /> And everyone knows it.
              </h2>
              <p className="text-stone-600 text-lg max-w-2xl mx-auto">
                Whether you buy or sell on WhatsApp, Instagram, or Telegram — you've felt this fear before.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {PAIN_CARDS.map((c) => (
                <div key={c.persona} className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
                  <div className="text-4xl mb-4">{c.emoji}</div>
                  <h3 className="text-xl font-bold text-stone-800 mb-4">{c.persona}</h3>
                  <div className="text-stone-600 leading-relaxed mb-6 text-base italic border-l-4 border-red-200 pl-4">
                    {c.story.map((itm, i) => (
                      <div key={i}>{itm}</div>
                    ))}
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <span className="text-red-700 font-bold text-lg">{c.stat}</span>{" "}
                    <span className="text-red-600 text-sm">{c.statLabel}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 bg-stone-800 text-white rounded-2xl p-8 text-center">
              <p className="text-xl font-bold mb-2">This isn't just your problem. It's everyone's problem.</p>
              <p className="text-stone-400 text-base">Billions of naira lost every year to failed social commerce transactions. Most of it completely preventable.</p>
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
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="lg:hidden flex justify-center my-2 text-stone-300 text-2xl">↓</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/register" className="inline-block bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg">
                Start Your First Transaction →
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ FEATURES ════════ */}
        <section className="py-20 sm:py-28 bg-stone-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">The Platform</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">Everything you need to transact safely</h2>
              <p className="text-stone-500 text-lg max-w-2xl mx-auto">
                Use Vaultlify directly in the browser, integrate it via API, or embed it inside your own product.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white rounded-2xl p-7 border border-stone-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full mb-3">{f.badge}</div>
                  <h3 className="font-bold text-stone-800 text-lg mb-2">{f.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ FOR BUSINESSES ════════ */}
        <section id="for-businesses" className="py-20 sm:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-4">For Businesses</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-5 leading-tight">
                  Add escrow to your product in an afternoon
                </h2>
                <p className="text-stone-600 text-lg leading-relaxed mb-8">
                  Running a marketplace, classifieds platform, or freelance site? Vaultlify gives you a production-ready escrow layer without building the compliance, banking relationships, or dispute infrastructure yourself.
                </p>
                <div className="space-y-5 mb-8">
                  {[
                    { icon: "🔑", title: "API key auth", desc: "Generate keys from your dashboard. Prefix-based lookup, bcrypt-hashed — never stored in plaintext." },
                    { icon: "🔔", title: "Webhook events", desc: "Get notified on every status change. HMAC-signed payloads so you can verify they came from us." },
                    { icon: "🔲", title: "Embeddable widget", desc: "One `<iframe>` drops the full escrow UI into your product. Listen for `postMessage` events to react in real time." },
                    { icon: "💲", title: "Custom fee config", desc: "Get a fee arrangement tailored to your volume — fixed, percentage, or free. Contact us to discuss." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</div>
                      <div>
                        <p className="font-bold text-stone-800 text-sm mb-0.5">{item.title}</p>
                        <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/register" className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                    Create a Business Account →
                  </Link>
                  <a href="mailto:hello@vaultlify.com" className="inline-block border border-stone-300 hover:border-stone-400 text-stone-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                    Contact Sales
                  </a>
                </div>
              </div>

              {/* Code snippet */}
              <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-stone-700">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500 opacity-70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-70" />
                  <span className="ml-2 text-xs text-stone-500 font-mono">Create &amp; invite via API</span>
                </div>
                <pre className="px-5 py-5 text-xs font-mono leading-relaxed overflow-x-auto">
                  <code className="text-stone-300">{`// 1. Create the escrow
const txn = await fetch(
  "https://vaultlify.com/api/v1/transactions",
  {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "MacBook Air M3",
      amount: 950000,
      role: "SELLER",
    }),
  }
).then((r) => r.json());

// 2. Generate the buyer's invite link
const invite = await fetch(
  \`https://vaultlify.com/api/v1/transactions/\${txn.data.id}/invite\`,
  {
    method: "POST",
    headers: { Authorization: \`Bearer \${API_KEY}\` },
    body: JSON.stringify({ role: "BUYER" }),
  }
).then((r) => r.json());

console.log(invite.data.shareUrl);
// → https://vaultlify.com/t/clx...?token=...`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ════════ TRUST ════════ */}
        <section className="py-20 sm:py-28 bg-stone-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">Why Trust Vaultlify</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">"How do I know you won't disappear with my money?"</h2>
              <p className="text-stone-500 text-lg max-w-2xl mx-auto">
                We expected that question. Here's exactly why we can't run off with your funds even if we wanted to.
              </p>
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
                  { q: "What if the buyer lies about not receiving the goods?",  a: "We ask for proof — tracking numbers, photos, delivery confirmations. Our team reviews real evidence. Liars don't win." },
                  { q: "What if the seller delivers something broken or fake?",  a: "The buyer has an inspection window before funds release. If something's wrong, they raise a dispute and we investigate." },
                  { q: "How long does the money stay in hold?",                  a: "You agree on the inspection period upfront — typically 24–72 hours after delivery. It's written into every transaction." },
                  { q: "Is this legal and regulated?",                           a: "Yes. We operate under Nigerian financial regulations for payment processing and escrow services. Full compliance, always." },
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
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              The next time you buy or sell online —<br />
              <span className="text-amber-100">you shouldn't have to pray it works out.</span>
            </h2>
            <p className="text-amber-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Create a protected transaction in 60 seconds. Both sides covered from the moment the deal begins.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-block bg-white text-amber-700 hover:bg-amber-50 active:scale-[0.98] font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl text-center">
                Create My First Safe Transaction →
              </Link>
              <Link href="/login" className="inline-block border-2 border-white/50 hover:border-white text-white font-semibold px-10 py-4 rounded-xl text-base transition-all text-center">
                Sign in
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-amber-100 mt-8">
              <span>✓ Free to start</span>
              <span>✓ No credit card</span>
              <span>✓ Both sides protected</span>
            </div>
          </div>
        </section>

        {/* ════════ FOOTER ════════ */}
        <footer className="bg-stone-900 text-stone-400 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 bg-emerald-700 rounded-md flex items-center justify-center text-white text-xs font-black">VL</div>
                  <span className="text-white font-black tracking-tight">Vault<span className="text-emerald-500">lify</span></span>
                </div>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Secure escrow for Nigerian buyers and sellers. Both sides protected, every time.
                </p>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-3">Product</p>
                <div className="space-y-2 text-sm">
                  <div><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></div>
                  <div><a href="#for-businesses" className="hover:text-white transition-colors">For businesses</a></div>
                  <div><Link href="/register" className="hover:text-white transition-colors">Create an account</Link></div>
                  <div><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></div>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-3">Company</p>
                <div className="space-y-2 text-sm">
                  <div><a href="mailto:hello@vaultlify.com" className="hover:text-white transition-colors">hello@vaultlify.com</a></div>
                  <div><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></div>
                  <div><a href="#" className="hover:text-white transition-colors">Terms of Service</a></div>
                </div>
              </div>
            </div>
            <div className="border-t border-stone-800 pt-8 text-center text-xs text-stone-600">
              <p>© {new Date().getFullYear()} Vaultlify Technologies Ltd. All rights reserved. Funds held in regulated escrow accounts.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
