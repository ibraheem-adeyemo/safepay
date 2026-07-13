import type { NextConfig } from "next";

// Applied to every route
const globalHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // unsafe-eval is NOT needed by Next.js 16 in production
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      // No site (including ourselves) may frame any page except /widget/*
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

// Override for /widget/* — must be embeddable in any third-party iframe
const widgetHeaders = [
  // Drop DENY so widget pages can be framed
  { key: "X-Frame-Options", value: "ALLOWALL" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      // Widget explicitly allows framing from any origin
      "frame-ancestors *",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: globalHeaders },
      // Widget override — must come after global so same-key headers win
      { source: "/widget/:path*", headers: widgetHeaders },
    ];
  },
};

export default nextConfig;
