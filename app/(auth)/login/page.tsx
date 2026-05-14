import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Welcome back</h1>
      <p className="text-stone-500 text-sm mb-6">Sign in to your SafePay account</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
