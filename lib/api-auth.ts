import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export async function authenticateApiKey(
  request: Request
): Promise<{ userId: string; keyId: string } | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7).trim();
  if (!token.startsWith("vl_live_")) return null;

  // Narrow to one candidate using the stored prefix before running bcrypt
  const prefix = token.slice(0, 15);
  const apiKey = await db.apiKey.findFirst({
    where: { prefix, isActive: true },
    select: { id: true, userId: true, keyHash: true, expiresAt: true },
  });
  if (!apiKey) return null;

  const valid = await compare(token, apiKey.keyHash);
  if (!valid) return null;

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Non-blocking timestamp update
  db.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { userId: apiKey.userId, keyId: apiKey.id };
}
