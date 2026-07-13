import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { FeeType, PartyRole } from "@prisma/client";
import { db } from "@/lib/db";

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

// VLT-20260511-A3K2P
export function generateReference(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `VLT-${date}-${rand}`;
}

export type InvitePrefill = { name?: string; email?: string; phone?: string };

// Signed JWT embedded in the counterparty share link
export async function generateInviteToken(
  txnId: string,
  counterpartyRole: PartyRole,
  prefill?: InvitePrefill
): Promise<string> {
  const claims: Record<string, unknown> = { txnId, role: counterpartyRole };
  if (prefill && Object.values(prefill).some(Boolean)) claims.prefill = prefill;
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function verifyInviteToken(
  token: string
): Promise<{ txnId: string; role: PartyRole; prefill?: InvitePrefill } | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as { txnId: string; role: PartyRole; prefill?: InvitePrefill };
  } catch {
    return null;
  }
}

// Resolves fee for a transaction: checks business override first, then global default
export async function calculateFee(
  amount: number,
  userId?: string
): Promise<{
  feeType: FeeType | null;
  feeValue: number | null;
  feeAmount: number;
}> {
  let feeConfig = null;

  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { business: { include: { feeConfig: true } } },
    });
    feeConfig = user?.business?.feeConfig ?? null;
  }

  if (!feeConfig) {
    feeConfig = await db.feeConfig.findFirst({ where: { businessId: null } });
  }

  if (!feeConfig || feeConfig.isFree) {
    return { feeType: null, feeValue: null, feeAmount: 0 };
  }

  const value = Number(feeConfig.feeValue);
  const raw =
    feeConfig.feeType === "PERCENTAGE" ? (amount * value) / 100 : value;
  return {
    feeType: feeConfig.feeType,
    feeValue: value,
    feeAmount: Math.round(raw * 100) / 100,
  };
}

export function getCounterpartyRole(role: PartyRole): PartyRole {
  return role === "BUYER" ? "SELLER" : "BUYER";
}

export function buildShareUrl(txnId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/t/${txnId}?token=${token}`;
}

export function formatAmount(amount: number | string | { toString(): string }): string {
  return Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Human-readable label and colour key for each status
export const STATUS_META: Record<
  string,
  { label: string; colour: string; bg: string }
> = {
  CREATED:           { label: "Awaiting counterparty", colour: "text-stone-600",  bg: "bg-stone-100" },
  AWAITING_PAYMENT:  { label: "Payment required",      colour: "text-amber-700",  bg: "bg-amber-100" },
  FUNDED:            { label: "Secured in escrow",     colour: "text-emerald-700",bg: "bg-emerald-100" },
  IN_PROGRESS:       { label: "Delivery in progress",  colour: "text-blue-700",   bg: "bg-blue-100" },
  DELIVERED:         { label: "Delivered — confirm?",  colour: "text-indigo-700", bg: "bg-indigo-100" },
  UNDER_INSPECTION:  { label: "Under inspection",      colour: "text-purple-700", bg: "bg-purple-100" },
  COMPLETED:         { label: "Completed",             colour: "text-emerald-700",bg: "bg-emerald-50" },
  DISPUTED:          { label: "Disputed",              colour: "text-red-700",    bg: "bg-red-100" },
  REFUNDED:          { label: "Refunded",              colour: "text-orange-700", bg: "bg-orange-100" },
  CANCELLED:         { label: "Cancelled",             colour: "text-stone-400",  bg: "bg-stone-100" },
};
