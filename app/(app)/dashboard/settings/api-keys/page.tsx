import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { deactivateApiKey } from "@/app/actions/account";
import ApiKeyForm from "./ApiKeyForm";

export default async function ApiKeysPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "BUSINESS") redirect("/dashboard/settings");

  const keys = await db.apiKey.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      {/* Generate new key */}
      <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6">
        <h2 className="text-base font-bold text-stone-900 mb-1">API Keys</h2>
        <p className="text-stone-400 text-xs mb-5">
          Use these keys to authenticate requests to the SafePay API. The full key is shown only once on creation — store it securely.
        </p>
        <ApiKeyForm />
      </div>

      {/* Existing keys */}
      {keys.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Your Keys</p>
          </div>
          <div className="divide-y divide-stone-100">
            {keys.map((key) => {
              const deactivateAction = deactivateApiKey.bind(null, key.id);
              return (
                <div key={key.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-stone-800">{key.label}</p>
                      {!key.isActive && (
                        <span className="text-xs bg-stone-100 text-stone-500 font-semibold px-2 py-0.5 rounded-full">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-stone-400">
                      {key.prefix}••••••••••••••••••••
                    </p>
                    {key.lastUsedAt && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        Last used{" "}
                        {new Date(key.lastUsedAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 shrink-0">
                    {new Date(key.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {key.isActive && (
                    <form action={deactivateAction}>
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700 font-semibold shrink-0 transition-colors"
                      >
                        Revoke
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
