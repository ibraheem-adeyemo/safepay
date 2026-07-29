import Link from "next/link";
import { confirmVerificationEmail } from "@/app/actions/auth";

interface Props {
  searchParams: Promise<{ token?: string; status?: string }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token, status } = await searchParams;

  // ── Post-submission result states ──────────────────────────────────────────

  if (status === "expired") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
        <div className="text-5xl mb-4">⏰</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Link has expired</h1>
        <p className="text-stone-500 text-sm mb-6 leading-relaxed">
          Your verification link is older than 24 hours. Request a new one below.
        </p>
        <Link
          href="/resend-verification"
          className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors"
        >
          Get a new link →
        </Link>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Invalid link</h1>
        <p className="text-stone-500 text-sm mb-6 leading-relaxed">
          This verification link is invalid or has already been used.
        </p>
        <Link
          href="/resend-verification"
          className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors"
        >
          Request a new link →
        </Link>
        <p className="text-sm text-stone-500 mt-4">
          Already verified?{" "}
          <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // ── No token ───────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">No token found</h1>
        <p className="text-stone-500 text-sm mb-6">
          Use the link from your verification email, or request a new one.
        </p>
        <Link
          href="/resend-verification"
          className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors"
        >
          Request a new link →
        </Link>
      </div>
    );
  }

  // ── Confirmation button (token present, not yet submitted) ─────────────────
  // The token is NOT consumed here — only the form submit below does that.
  // This protects against email security scanners that pre-fetch all links.

  const confirmAction = confirmVerificationEmail.bind(null, token);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
      <div className="text-5xl mb-4">📧</div>
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Confirm your email</h1>
      <p className="text-stone-500 text-sm mb-6 leading-relaxed">
        Click the button below to verify your email address and activate your Vaultlify account.
      </p>
      <form action={confirmAction}>
        <button
          type="submit"
          className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold py-3 px-8 rounded-xl text-sm transition-all"
        >
          Confirm my email address →
        </button>
      </form>
      <p className="text-xs text-stone-400 mt-6">
        Link not working?{" "}
        <Link href="/resend-verification" className="text-emerald-700 font-semibold hover:underline">
          Request a new one
        </Link>
      </p>
    </div>
  );
}
