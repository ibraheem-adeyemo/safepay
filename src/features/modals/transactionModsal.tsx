
import { useEffect, useRef, useState } from "react";
import { ProgressBar } from "../components/ProgressBar";
import { StepDots } from "../components/StepDots";
import { Chip } from "../components/Chip";
import { AMOUNT_RANGES, TAKEN_SLOTS, TOTAL_SLOTS, WEEK_SLOTS, WEEK_TAKEN } from "@/src/contants";

// export function TransactionModal({ isOpen, remaining, onClose, onContinue }: {isOpen:boolean; remaining:number, onClose:()=>void, onContinue:(formObj:TransactionData)=>void}) {
//   const [form, setForm] = useState({
//     item: "",
//     amount: "",
//     role: "",
//   });

//   if (!isOpen) return null;

//   const handleSubmit = () => {
//     if (!form.item || !form.amount || !form.role) return;

//     onContinue(form); // pass data to next step
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-xl p-6 w-full max-w-md">
//         <h2 className="text-xl font-bold mb-4">
//           Create Your Transaction
//         </h2>

//         <p className="text-xs text-amber-600 mt-2 mb-2">
//               ⚡ We can manually secure your transaction today for early users
//             </p>

//             <p className="text-xs mb-2">Only {remaining} early users can complete transactions this week</p>

//         <input
//           placeholder="Item (e.g iPhone 13)"
//           className="w-full border p-3 rounded mb-3"
//           value={form.item}
//           onChange={(e) => setForm({ ...form, item: e.target.value })}
//         />

//         <input
//           placeholder="Amount (₦)"
//           className="w-full border p-3 rounded mb-3"
//           value={form.amount}
//           onChange={(e) => setForm({ ...form, amount: e.target.value })}
//         />

//         <select
//           className="w-full border p-3 rounded mb-4"
//           value={form.role}
//           onChange={(e) => setForm({ ...form, role: e.target.value })}
//         >
//           <option value="">I am a...</option>
//           <option value="buyer">Buyer</option>
//           <option value="seller">Seller</option>
//         </select>

//         <button
//           onClick={handleSubmit}
//           className="w-full bg-emerald-700 text-white py-3 rounded"
//         >
//           Continue →
//         </button>
//       </div>
//     </div>
//   );
// }

async function submitToGoogleForms(tx: TxForm, wl: WlForm): Promise<void> {
  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name:              wl.name.trim(),
      email:             wl.email.trim(),
      role:              tx.role,
      itemName:          tx.itemName.trim(),
      transactionAmount: tx.dealAmount.trim(),
      phoneNumber:       wl.phoneNumber.trim(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data?.message || "Submission failed");
  }
}

export function TransactionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<ModalStep>("tx");
  const [tx, setTx] = useState<TxForm>({ itemName: "", dealAmount: "", role: "" });
  const [txErr, setTxErr] = useState<TxErrors>({});
  const [wl, setWl] = useState<WlForm>({ name: "", email: "", phoneNumber: "" });
  const [wlErr, setWlErr] = useState<WlErrors | null>(null);
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
 
  useEffect(() => {
    if (isOpen) {
      setStep("tx"); setTx({ itemName: "", dealAmount: "", role: "" }); setTxErr({});
      setWl({ name: "", email: "", phoneNumber: "" }); setWlErr(null);
      setSubmitError(""); setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);
 
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && step !== "submitting") onClose(); };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, [onClose, step]);
 
  const validateTx = (): boolean => {
    const e: TxErrors = {};
    if (!tx.itemName.trim())   e.itemName   = "What are you buying or selling?";
    if (!tx.dealAmount.trim()) e.dealAmount = "Enter the transaction amount";
    if (!tx.role)              e.role       = "Are you the buyer or seller in this deal?";
    setTxErr(e); return Object.keys(e).length === 0;
  };
 
  const validateWl = (): boolean => {
    const e: WlErrors = {};
    if (!wl.name.trim())  e.name  = "We need your name to save your spot";
    if (!wl.email.trim()) e.email = "Email required to confirm your slot";
    if (!wl.phoneNumber.trim()) e.phoneNumber = "Phone number required";
    else if (!/\S+@\S+\.\S+/.test(wl.email)) e.email = "Please enter a valid email";
    if (!wl.phoneNumber) e.phoneNumber = "Quick one — this helps us to get in touch with you";
    setWlErr(e); return Object.keys(e).length === 0;
  };
 
  const handleWlSubmit = async () => {
    if (!validateWl()) return; setStep("submitting");
    try { await submitToGoogleForms(tx, wl); setStep("success"); }
    catch { setSubmitError("Something went wrong. Please try again."); setStep("error"); }
  };
 
  if (!isOpen) return null;
  const firstName = wl.name.trim().split(" ")[0];
 
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && step !== "submitting" && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[96vh] flex flex-col">
 
        {/* Header */}
        <div className={`px-6 py-5 flex-shrink-0 transition-colors duration-500 ${step === "gate" ? "bg-amber-600" : "bg-emerald-800"}`}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className={`text-xs font-semibold tracking-widest uppercase mb-1 ${step === "gate" ? "text-amber-200" : "text-emerald-300"}`}>
                {step === "tx"       && `Create Transaction · ${WEEK_SLOTS - WEEK_TAKEN} slots left`}
                {step === "gate"     && "⚡ Almost there — one more step"}
                {step === "waitlist" && "Step 2 of 2 — Confirm your spot"}
                {step === "success"  && "Transaction reserved!"}
                {step === "error"    && "Submission failed"}
                {step === "submitting" && "Saving your spot…"}
              </p>
              <h3 className="text-white text-lg font-bold leading-snug">
                {step === "tx"         && "Create your protected transaction"}
                {step === "gate"       && "We're manually securing first deals"}
                {step === "waitlist"   && "Complete your early access signup"}
                {step === "success"    && "You're in! 🎉"}
                {step === "error"      && "Something went wrong"}
                {step === "submitting" && "Locking in your transaction…"}
              </h3>
            </div>
            {step !== "submitting" && (
              <button onClick={onClose} aria-label="Close" className="text-white/60 hover:text-white text-2xl leading-none ml-4 mt-0.5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all">×</button>
            )}
          </div>
          {(step === "tx" || step === "waitlist") && (
            <div className="mt-3"><ProgressBar taken={TAKEN_SLOTS} total={TOTAL_SLOTS} light /></div>
          )}
        </div>
 
        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
 
          {/* ── STEP 1: Fake product (transaction details) ── */}
          {step === "tx" && (
            <>
              <StepDots current={0} total={3} />
              <p className="text-stone-500 text-sm mb-5 text-center">Fill in the details to generate your protected transaction link.</p>
              <div className="space-y-4">
                {/* Item */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">What are you buying or selling?</label>
                  <input ref={inputRef} type="text" placeholder="e.g. iPhone 15, Ankara fabric, Logo design…"
                    value={tx.itemName}
                    onChange={(e) => { setTx({ ...tx, itemName: e.target.value }); if (txErr.itemName) setTxErr({ ...txErr, itemName: undefined }); }}
                    className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${txErr.itemName ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"}`}
                  />
                  {txErr.itemName && <p className="text-red-500 text-xs mt-1.5">⚠ {txErr.itemName}</p>}
                </div>
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Transaction amount (₦)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm select-none">₦</span>
                    <input type="text" inputMode="numeric" placeholder="e.g. 85,000"
                      value={tx.dealAmount}
                      onChange={(e) => { setTx({ ...tx, dealAmount: e.target.value.replace(/[^0-9,]/g, "") }); if (txErr.dealAmount) setTxErr({ ...txErr, dealAmount: undefined }); }}
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${txErr.dealAmount ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"}`}
                    />
                  </div>
                  <p className="text-xs mt-1.5">🔒 Your money is held securely until both parties confirm</p>
                  {txErr.dealAmount && <p className="text-red-500 text-xs mt-1.5">⚠ {txErr.dealAmount}</p>}
                </div>
                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">In this transaction, you are the…</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Chip selected={tx.role === "Buyer"}  onClick={() => { setTx({ ...tx, role: "Buyer" });  setTxErr({ ...txErr, role: undefined }); }} color="green">🛒 Buyer</Chip>
                    <Chip selected={tx.role === "Seller"} onClick={() => { setTx({ ...tx, role: "Seller" }); setTxErr({ ...txErr, role: undefined }); }} color="blue">📦 Seller</Chip>
                  </div>
                  {txErr.role && <p className="text-red-500 text-xs mt-1.5">⚠ {txErr.role}</p>}
                </div>
              </div>
 
              {/* Live preview — makes it feel real */}
              {(tx.itemName || tx.dealAmount) && (
                <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-2">Transaction preview</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-800 text-sm">{tx.itemName || "—"}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{tx.role || "Role not set"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700">{tx.dealAmount ? `₦${tx.dealAmount}` : "—"}</p>
                      <p className="text-xs text-emerald-500">🛡 Protected</p>
                    </div>
                  </div>
                </div>
              )}
 
              <button onClick={() => { if (validateTx()) setStep("gate"); }} className="mt-6 w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-emerald-100">
                Generate Protected Link →
              </button>
              <p className="text-center text-xs text-stone-400 mt-3">Free to create. Both sides protected from day one.</p>
            </>
          )}
 
          {/* ── STEP 2: THE GATE — the real validation moment ── */}
          {step === "gate" && (
            <div className="text-center py-2">
              <StepDots current={1} total={3} />
 
              {/* Transaction summary — make it feel like the product worked */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 mb-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Your Transaction</p>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">Pending</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-stone-500">Item</span><span className="font-semibold text-stone-800">{tx.itemName}</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">Amount</span><span className="font-bold text-emerald-700">₦{tx.dealAmount}</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">Your role</span><span className="font-semibold text-stone-800">{tx.role}</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">Protection</span><span className="font-semibold text-emerald-600">🛡 Vaultlify Escrow</span></div>
                </div>
              </div>
 
              <div className="mb-6">
                <div className="text-4xl mb-3">🚀</div>
                <h4 className="text-xl font-bold text-stone-800 mb-3 leading-snug">
                  We're onboarding early users manually
                </h4>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                  Your transaction is ready — but we're not fully open yet. Right now,{" "}
                  <strong>our team is personally securing first transactions</strong>{" "}
                  so we can make sure everything works perfectly for you.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  <strong>⚡ Only {WEEK_SLOTS - WEEK_TAKEN} manual slots left this week.</strong>{" "}
                  Join now and we'll personally handle this transaction with you.
                </div>
              </div>
 
              <button onClick={() => setStep("waitlist")} className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg mb-3">
                Complete Signup — Hold My Slot →
              </button>
              <button onClick={onClose} className="text-sm text-stone-400 hover:text-stone-600 underline transition-colors">
                I'll come back later
              </button>
            </div>
          )}
 
          {/* ── STEP 3: Waitlist form ── */}
          {step === "waitlist" && (
            <>
              <StepDots current={2} total={3} />
              <p className="text-stone-500 text-sm mb-5 text-center">We'll reach out to complete your transaction personally.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Your first name</label>
                  <input type="text" placeholder="e.g. Tunde"
                    value={wl.name}
                    onChange={(e) => { setWl({ ...wl, name: e.target.value }); if (wlErr?.name) setWlErr({ ...wlErr, name: undefined }); }}
                    className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${wlErr?.name ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"}`}
                  />
                  {wlErr?.name && <p className="text-red-500 text-xs mt-1.5">⚠ {wlErr?.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email address</label>
                  <input type="email" placeholder="you@email.com"
                    value={wl.email}
                    onChange={(e) => { setWl({ ...wl, email: e.target.value }); if (wlErr?.email) setWlErr({ ...wlErr, email: undefined }); }}
                    className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${wlErr?.email ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"}`}
                  />
                  {wlErr?.email && <p className="text-red-500 text-xs mt-1.5">⚠ {wlErr.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone number</label>
                  <input type="tel" placeholder="+2347012345678"
                    value={wl.phoneNumber}
                    onChange={(e) => { setWl({ ...wl, phoneNumber: e.target.value }); if (wlErr?.phoneNumber) setWlErr({ ...wlErr, phoneNumber: undefined }); }}
                    className={`w-full px-4 py-3 rounded-xl border text-stone-800 placeholder:text-stone-400 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${wlErr?.phoneNumber ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"}`}
                  />
                  {wlErr?.phoneNumber && <p className="text-red-500 text-xs mt-1.5">⚠ {wlErr.phoneNumber}</p>}
                </div>
                {/* <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Have you been scammed online before?</label>
                  <p className="text-xs text-stone-400 mb-2">No judgement — helps us understand how big this problem is.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Chip selected={wl.scammed === "Yes"} onClick={() => { setWl({ ...wl, scammed: "Yes" }); setWlErr({ ...wlErr, scammed: undefined }); }} color="red">😞 Yes, I have</Chip>
                    <Chip selected={wl.scammed === "No"}  onClick={() => { setWl({ ...wl, scammed: "No" });  setWlErr({ ...wlErr, scammed: undefined }); }} color="green">🙏 Not yet</Chip>
                  </div>
                  {wlErr.scammed && <p className="text-red-500 text-xs mt-1.5">⚠ {wlErr.scammed}</p>}
                </div> */}
                {/* <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">
                    Typical deal size? <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AMOUNT_RANGES.map((r) => (
                      <button key={r.value} type="button"
                        onClick={() => setWl({ ...wl, transactionAmount: wl.transactionAmount === r.value ? "" : r.value })}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${wl.transactionAmount === r.value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"}`}
                      >{r.label}</button>
                    ))}
                  </div>
                </div> */}
              </div>
              <button onClick={handleWlSubmit} className="mt-6 w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-emerald-100">
                Complete My Signup →
              </button>
              <p className="text-center text-xs text-stone-400 mt-3">No spam. We'll contact you personally within 24 hrs to complete your first transaction.</p>
            </>
          )}
 
          {/* ── Submitting ── */}
          {step === "submitting" && (
            <div className="py-14 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-stone-600 text-sm font-medium">Securing your slot…</p>
            </div>
          )}
 
          {/* ── Success ── */}
          {step === "success" && (
            <div className="py-4 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h4 className="text-xl font-bold text-stone-800 mb-2">You're in{firstName ? `, ${firstName}` : ""}!</h4>
              <p className="text-stone-600 text-sm leading-relaxed mb-5">
                Your transaction is reserved. Our team will reach out to{" "}
                <span className="text-emerald-700 font-semibold">{wl.email}</span>{" "}
                within <strong>24 hours</strong> to personally complete your first protected deal.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-left mb-5 space-y-2">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Your saved transaction</p>
                <div className="flex justify-between"><span className="text-stone-500">Item</span><span className="font-semibold text-stone-800">{tx.itemName}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Amount</span><span className="font-bold text-emerald-700">₦{tx.dealAmount}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Role</span><span className="font-semibold text-stone-800">{tx.role}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Status</span><span className="font-semibold text-amber-600">🕐 Pending manual review</span></div>
              </div>
              <div className="bg-stone-100 rounded-xl px-4 py-3 text-xs text-stone-500 mb-5">
                📌 Waitlist position: <strong>#{TAKEN_SLOTS + 1}</strong>
              </div>
              <p className="text-xs text-stone-400 mb-4">Know someone who buys or sells online? Share Vaultlify — referrals move you up the priority list.</p>
              <button onClick={onClose} className="text-sm text-stone-400 underline hover:text-stone-600 transition-colors">Close</button>
            </div>
          )}
 
          {/* ── Error ── */}
          {step === "error" && (
            <div className="py-10 text-center">
              <div className="text-4xl mb-4">😔</div>
              <h4 className="text-lg font-bold text-stone-800 mb-2">Submission failed</h4>
              <p className="text-stone-500 text-sm mb-6">{submitError}</p>
              <button onClick={() => setStep("waitlist")} className="bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl text-sm">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}