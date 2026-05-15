import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AccountType } from "@prisma/client";
import { db } from "@/lib/db";

export type SessionPayload = {
  userId: string;
  accountType: AccountType;
  name: string;
  expiresAt: string;
};

const COOKIE_NAME = "sp_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env variable is not set");
  return new TextEncoder().encode(secret);
}

function cookieOptions(expiresAt: Date) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    // SameSite=None + Secure lets the cookie be sent in cross-site iframes
    // (embedded widget). In local dev the widget is on the same origin so Lax is fine.
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    expires: expiresAt,
    path: "/",
  };
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

/** Decodes a session token without any DB validation — for use in middleware only. */
export async function decryptSession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: Omit<SessionPayload, "expiresAt">) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encryptSession({ ...payload, expiresAt: expiresAt.toISOString() });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, cookieOptions(expiresAt));
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload: SessionPayload & { iat?: number };
  try {
    const { payload: raw } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    payload = raw as unknown as SessionPayload & { iat?: number };
  } catch {
    return null;
  }

  // Reject sessions that were issued before the user's last password change.
  // This ensures changing/resetting a password immediately invalidates stolen tokens.
  if (payload.iat) {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { passwordChangedAt: true },
    });
    if (user?.passwordChangedAt) {
      const issuedAt = new Date(payload.iat * 1000);
      if (issuedAt < user.passwordChangedAt) return null;
    }
  }

  return payload;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function refreshSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encryptSession({ ...payload, expiresAt: expiresAt.toISOString() });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, cookieOptions(expiresAt));
}
