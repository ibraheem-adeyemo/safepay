import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
      <div className="text-5xl mb-4">📬</div>
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Check your inbox</h1>
      <p className="text-stone-500 text-sm mb-4 leading-relaxed">
        We&apos;ve sent a verification link to your email address. Click it to activate your
        account and start using Vaultlify.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-4">
        Can&apos;t find it? Check your <strong>spam or junk folder</strong>.
      </div>
      <p className="text-xs text-stone-400 mb-6">
        The link expires in 24 hours.
      </p>
      <Link
        href="/resend-verification"
        className="inline-block border border-stone-200 hover:border-emerald-400 text-stone-600 hover:text-emerald-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        Didn&apos;t receive it? Resend →
      </Link>
      <p className="text-sm text-stone-500 mt-5">
        Already verified?{" "}
        <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
