import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { isSafeWebhookUrl } from "@/lib/ssrf";

export async function dispatchWebhooks(
  txnId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const parties = await db.transactionParty.findMany({
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
    });

    const webhooks = parties.flatMap((p) => p.user.business?.webhooks ?? []);
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
              "X-SafePay-Signature": `sha256=${sig}`,
              "X-SafePay-Event": event,
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
