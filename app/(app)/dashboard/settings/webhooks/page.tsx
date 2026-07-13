import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { deleteWebhook } from "@/app/actions/account";
import WebhookForm from "./WebhookForm";

export default async function WebhooksPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "BUSINESS") redirect("/dashboard/settings");

  const business = await db.business.findUnique({
    where: { userId: session.userId },
    include: { webhooks: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-stone-200 px-6 py-6">
        <h2 className="text-base font-bold text-stone-900 mb-1">Webhooks</h2>
        <p className="text-stone-400 text-xs mb-1">
          Vaultlify will POST a signed JSON payload to your URL when selected events occur.
        </p>
        {!business && (
          <p className="text-amber-600 text-xs font-semibold mb-4">
            Set up your business profile first before adding webhooks.
          </p>
        )}
        {business && <WebhookForm />}
      </div>

      {business && business.webhooks.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
              Active Webhooks
            </p>
          </div>
          <div className="divide-y divide-stone-100">
            {business.webhooks.map((wh) => {
              const deleteAction = deleteWebhook.bind(null, wh.id);
              return (
                <div key={wh.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-mono text-stone-700 truncate">{wh.url}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {wh.events.map((evt) => (
                          <span
                            key={evt}
                            className="text-xs bg-stone-100 text-stone-600 font-mono px-2 py-0.5 rounded-full"
                          >
                            {evt}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-stone-400 mt-2">
                        Secret: <code className="font-mono">{wh.secret.slice(0, 8)}••••••••</code>
                      </p>
                    </div>
                    <form action={deleteAction} className="shrink-0">
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
