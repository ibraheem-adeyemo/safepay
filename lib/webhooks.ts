import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { isSafeWebhookUrl } from "@/lib/ssrf";

export async function dispatchWebhooks(
  txnId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    // Collect webhooks from two sources:
    // 1. Businesses that are direct parties to this transaction
    // 2. The platform that orchestrated it (platformId), if any — marketplace mode
    const [parties, transaction] = await Promise.all([
      db.transactionParty.findMany({
        where: { transactionId: txnId },
        include: {
          user: {
            include: {
              business: {
                include: {
                  webhooks: { where: { isActive: true, events: { has: event } } },
                },
              },
            },
          },
        },
      }),
      db.transaction.findUnique({
        where: { id: txnId },
        select: { platformId: true },
      }),
    ]);

    const partyWebhooks = parties.flatMap((p) => p.user.business?.webhooks ?? []);

    let platformWebhooks: typeof partyWebhooks = [];
    if (transaction?.platformId) {
      const platform = await db.user.findUnique({
        where: { id: transaction.platformId },
        include: {
          business: {
            include: {
              webhooks: { where: { isActive: true, events: { has: event } } },
            },
          },
        },
      });
      platformWebhooks = platform?.business?.webhooks ?? [];
    }

    // Deduplicate by id in case the platform is also a party
    const seen = new Set<string>();
    const webhooks = [...partyWebhooks, ...platformWebhooks].filter((wh) => {
      if (seen.has(wh.id)) return false;
      seen.add(wh.id);
      return true;
    });

    if (webhooks.length === 0) return;

    const body = JSON.stringify({
      event,
      transactionId: txnId,
      timestamp: new Date().toISOString(),
      ...payload,
    });

    await Promise.allSettled(
      webhooks
        .filter((wh) => isSafeWebhookUrl(wh.url)) // block SSRF targets
        .map(async (wh) => {
          const sig = createHmac("sha256", wh.secret).update(body).digest("hex");
          await fetch(wh.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Vaultlify-Signature": `sha256=${sig}`,
              "X-Vaultlify-Event": event,
            },
            body,
            signal: AbortSignal.timeout(5000),
          });
        })
    );
  } catch {
    // Best-effort — webhook failures must never break the calling action
  }
}
