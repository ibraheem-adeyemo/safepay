import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "SafePay <notifications@safepay.ng>";
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://safepay.ng";

export function txnUrl(txnId: string) {
  return `${BASE}/dashboard/transactions/${txnId}`;
}

// Best-effort — never throws, silently skips when RESEND_API_KEY is not set
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;max-width:520px;width:100%;">
        <tr>
          <td style="background:#166534;padding:20px 32px;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              Safe<span style="color:#f59e0b;">Pay</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f5f5f4;text-align:center;">
            <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.5;">
              SafePay Escrow · Protecting Nigerian transactions<br/>
              This is an automated message — please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#166534;color:#ffffff;font-weight:700;font-size:14px;padding:13px 28px;border-radius:12px;text-decoration:none;margin-top:24px;">${label} →</a>`;
}

function h2(text: string) {
  return `<h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1c1917;line-height:1.3;">${text}</h2>`;
}

function p(text: string) {
  return `<p style="margin:0 0 8px;font-size:14px;color:#57534e;line-height:1.65;">${text}</p>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function emailTransactionCreated(
  name: string,
  title: string,
  amount: string,
  txnId: string
) {
  return layout(`
    ${h2(`Your escrow is ready, ${firstName(name)}!`)}
    ${p(`Your SafePay escrow for <strong>${title}</strong> has been created for ₦${amount}.`)}
    ${p(`Share the invite link with the other party to activate the deal.`)}
    ${btn(txnUrl(txnId), "View Transaction")}
  `);
}

export function emailCounterpartyJoined(
  name: string,
  counterpartyName: string,
  title: string,
  role: string,
  txnId: string
) {
  return layout(`
    ${h2("Your counterparty has joined!")}
    ${p(`Hi ${firstName(name)}, <strong>${counterpartyName}</strong> has joined your escrow for <strong>${title}</strong> as the ${role.toLowerCase()}. The deal is now active.`)}
    ${btn(txnUrl(txnId), "View Transaction")}
  `);
}

export function emailYouJoined(
  name: string,
  title: string,
  amount: string,
  role: string,
  txnId: string
) {
  return layout(`
    ${h2("You've joined an escrow!")}
    ${p(`Hi ${firstName(name)}, you've joined <strong>${title}</strong> as the <strong>${role.toLowerCase()}</strong> for ₦${amount}.`)}
    ${p(`Your payment is protected by SafePay until the deal is complete.`)}
    ${btn(txnUrl(txnId), "View Transaction")}
  `);
}

export function emailPaymentConfirmed(
  name: string,
  title: string,
  amount: string,
  txnId: string
) {
  return layout(`
    ${h2("Payment confirmed — escrow funded ✅")}
    ${p(`Hi ${firstName(name)}, the payment of ₦${amount} for <strong>${title}</strong> has been confirmed and secured in escrow.`)}
    ${p(`The seller can now proceed with delivery.`)}
    ${btn(txnUrl(txnId), "View Transaction")}
  `);
}

export function emailItemDelivered(
  name: string,
  title: string,
  txnId: string
) {
  return layout(`
    ${h2("Item marked as delivered 📦")}
    ${p(`Hi ${firstName(name)}, the seller has marked <strong>${title}</strong> as delivered. Please review and confirm receipt to release the payment.`)}
    ${btn(txnUrl(txnId), "Confirm Receipt")}
  `);
}

export function emailTransactionCompleted(
  name: string,
  title: string,
  amount: string,
  txnId: string
) {
  return layout(`
    ${h2("Transaction completed 🎉")}
    ${p(`Hi ${firstName(name)}, the buyer has confirmed receipt of <strong>${title}</strong>. Payment of ₦${amount} will be released to you.`)}
    ${btn(txnUrl(txnId), "View Transaction")}
  `);
}

export function emailDisputeRaised(
  name: string,
  title: string,
  txnId: string
) {
  return layout(`
    ${h2("A dispute has been raised ⚠️")}
    ${p(`Hi ${firstName(name)}, a dispute has been raised on <strong>${title}</strong>.`)}
    ${p(`Our team will review the situation and reach out to both parties shortly.`)}
    ${btn(txnUrl(txnId), "View Transaction")}
  `);
}

export function emailDisputeResolved(
  name: string,
  title: string,
  txnId: string
) {
  return layout(`
    ${h2("Dispute resolved ✅")}
    ${p(`Hi ${firstName(name)}, the dispute on <strong>${title}</strong> has been resolved by our team.`)}
    ${btn(txnUrl(txnId), "View Transaction")}
  `);
}

export function emailTransactionCancelled(name: string, title: string) {
  return layout(`
    ${h2("Transaction cancelled")}
    ${p(`Hi ${firstName(name)}, the escrow for <strong>${title}</strong> has been cancelled. No funds have been taken.`)}
    <p style="margin:24px 0 0;font-size:13px;color:#a8a29e;">If you have any questions, reply to this email or visit SafePay.</p>
  `);
}

export function emailClaimAccount(name: string, claimUrl: string) {
  return layout(`
    ${h2("Secure your SafePay account")}
    ${p(`Hi ${firstName(name)}, a SafePay account was created for you when you joined a transaction.`)}
    ${p(`Set a password now to access your full dashboard, track your escrows, and manage future transactions — all in one place.`)}
    <p style="margin:8px 0 0;font-size:12px;color:#a8a29e;">This link expires in 48 hours.</p>
    ${btn(claimUrl, "Set My Password")}
  `);
}

export function emailPasswordReset(name: string, resetUrl: string) {
  return layout(`
    ${h2("Reset your SafePay password")}
    ${p(`Hi ${firstName(name)}, we received a request to reset the password on your SafePay account.`)}
    ${p(`Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.`)}
    <p style="margin:8px 0 0;font-size:12px;color:#a8a29e;">This link expires in 1 hour.</p>
    ${btn(resetUrl, "Reset My Password")}
  `);
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function firstName(name: string) {
  return name.split(" ")[0];
}
