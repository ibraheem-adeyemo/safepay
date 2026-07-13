import { createHash } from "crypto";

/**
 * One-way SHA-256 hash for high-entropy random tokens (claim links, reset links).
 * SHA-256 is appropriate here — no need for bcrypt since tokens are already
 * 32 random bytes (256 bits of entropy), making brute-force infeasible.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
