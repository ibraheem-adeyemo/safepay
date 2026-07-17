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
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6">
        Can&apos;t find it? Check your <strong>spam or junk folder</strong>.
      </div>
      <p className="text-xs text-stone-400">
        The link expires in 24 hours.{" "}
        <Link href="/register" className="text-emerald-700 font-semibold hover:underline">
          Register again
        </Link>{" "}
        to get a new one.
      </p>
      <p className="text-sm text-stone-500 mt-6">
        Already verified?{" "}
        <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
