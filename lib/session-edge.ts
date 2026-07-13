// Pure JWT helpers with no Node.js or Prisma dependencies.
// Safe to import from proxy.ts regardless of how the host platform bundles it.
import { jwtVerify } from "jose";

export type SessionPayload = {
  userId: string;
  // Inlined to avoid pulling @prisma/client into the proxy bundle.
  accountType: "PERSONAL" | "BUSINESS" | "ADMIN" | "SUPER_ADMIN";
  name: string;
  expiresAt: string;
};

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env variable is not set");
  return new TextEncoder().encode(secret);
}

/** Decodes a session JWT — no database lookup. Safe for middleware/proxy. */
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
