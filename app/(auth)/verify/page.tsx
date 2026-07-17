import Link from "next/link";
import { verifyEmail } from "@/app/actions/auth";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = await verifyEmail(token ?? "");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
      {result.success ? (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Email verified!</h1>
          <p className="text-stone-500 text-sm mb-6 leading-relaxed">{result.message}</p>
          <Link
            href="/login"
            className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors"
          >
            Sign in →
          </Link>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Verification failed</h1>
          <p className="text-stone-500 text-sm mb-6 leading-relaxed">{result.message}</p>
          <Link
            href="/register"
            className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors"
          >
            Register again
          </Link>
          <p className="text-sm text-stone-500 mt-4">
            Already verified?{" "}
            <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
