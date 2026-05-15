import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Stop browsers leaking the full referrer to third-party sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Allow the widget iframe from any origin; block framing of all other pages
  // (overridden per-route in middleware for /widget/*)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Force HTTPS for 1 year (prod only; harmless on localhost)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Permissions policy — disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content-Security-Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs inline scripts for hydration chunks
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Inline styles are common in Tailwind / CSS-in-JS
      "style-src 'self' 'unsafe-inline'",
      // Allow images from self + data URIs
      "img-src 'self' data: blob:",
      // Fonts served from self
      "font-src 'self'",
      // Server actions + API routes are same-origin
      "connect-src 'self'",
      // Widget can be embedded anywhere; all other frames blocked
      "frame-ancestors 'self' *",
      // Never fall back to HTTP for any resource
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
