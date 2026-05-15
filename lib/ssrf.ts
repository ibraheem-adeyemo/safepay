/**
 * Blocks webhook/callback URLs that point at private infrastructure.
 * DNS-level SSRF (e.g. evil.com → 10.0.0.1) is not caught here, but the
 * obvious direct-IP and localhost attacks are.
 */

const PRIVATE_IP_RE = [
  /^127\./,                          // loopback
  /^10\./,                           // RFC-1918 Class A
  /^172\.(1[6-9]|2\d|3[01])\./,     // RFC-1918 Class B
  /^192\.168\./,                     // RFC-1918 Class C
  /^169\.254\./,                     // link-local / AWS metadata (169.254.169.254)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT (RFC 6598)
  /^0\./,                            // "this" network
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 unique-local
  /^fe80:/i,                         // IPv6 link-local
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",        // GCP metadata
]);

export function isSafeWebhookUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host)) return false;

  // Strip IPv6 brackets for regex matching
  const ip = host.startsWith("[") ? host.slice(1, -1) : host;
  if (PRIVATE_IP_RE.some((re) => re.test(ip))) return false;

  return true;
}
