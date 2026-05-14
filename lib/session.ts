import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AccountType } from "@prisma/client";

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

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

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

  const isProd = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    // SameSite=None + Secure=true lets the session cookie be sent inside
    // cross-site iframes (embedded widget). SameSite=Lax is fine for local dev
    // because the widget runs on the same origin there.
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function refreshSession(payload: SessionPayload) {
  const isProd = process.env.NODE_ENV === "production";
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encryptSession({ ...payload, expiresAt: expiresAt.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    expires: expiresAt,
    path: "/",
  });
}
