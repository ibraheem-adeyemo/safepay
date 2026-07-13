import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_BY_EMAIL = 10;           // attempts per email per window
const MAX_BY_IP = 30;              // attempts per IP per window (catches credential-stuffing)

function windowStart() {
  return new Date(Date.now() - WINDOW_MS);
}

/** Returns true when the request should be allowed. */
export async function checkLoginRateLimit(email: string, ip: string): Promise<boolean> {
  const start = windowStart();

  const [byEmail, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { identifier: email, createdAt: { gte: start } } }),
    db.loginAttempt.count({ where: { ip, createdAt: { gte: start } } }),
  ]);

  return byEmail < MAX_BY_EMAIL && byIp < MAX_BY_IP;
}

/** Call on every failed login attempt. */
export async function recordFailedLogin(email: string, ip: string): Promise<void> {
  await db.loginAttempt.create({ data: { identifier: email, ip } });
  // Best-effort cleanup of records older than the window
  db.loginAttempt.deleteMany({ where: { createdAt: { lt: windowStart() } } }).catch(() => {});
}

/** Call on successful login to clear the counter for that email. */
export async function clearLoginAttempts(email: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { identifier: email } });
}

// ─── Password reset — 3 requests per email per hour ──────────────────────────

const RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_RESET_BY_EMAIL = 3;

export async function checkPasswordResetRateLimit(email: string): Promise<boolean> {
  const start = new Date(Date.now() - RESET_WINDOW_MS);
  const count = await db.loginAttempt.count({
    where: { identifier: `reset:${email}`, createdAt: { gte: start } },
  });
  return count < MAX_RESET_BY_EMAIL;
}

export async function recordPasswordResetAttempt(email: string): Promise<void> {
  await db.loginAttempt.create({ data: { identifier: `reset:${email}`, ip: "unknown" } });
}

// ─── Registration — 10 accounts per IP per hour ───────────────────────────────

const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REGISTER_BY_IP = 10;

export async function checkRegistrationRateLimit(ip: string): Promise<boolean> {
  const start = new Date(Date.now() - REGISTER_WINDOW_MS);
  const count = await db.loginAttempt.count({
    where: { identifier: `register:${ip}`, createdAt: { gte: start } },
  });
  return count < MAX_REGISTER_BY_IP;
}

export async function recordRegistrationAttempt(ip: string): Promise<void> {
  await db.loginAttempt.create({ data: { identifier: `register:${ip}`, ip } });
}
