# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # start dev server
npm run build        # prisma generate + next build
npm run lint         # eslint

npm run db:push      # push schema changes to DB (use DATABASE_URL_UNPOOLED for direct connection)
npm run db:generate  # regenerate Prisma client after schema changes (rm -rf node_modules/.prisma first if types are stale)
npm run db:seed      # seed database
npm run db:studio    # open Prisma Studio
```

After any `prisma/schema.prisma` change: run `rm -rf node_modules/.prisma && npm run db:generate` to force full client regeneration, then `npm run db:push` using the unpooled connection string.

## Architecture

### Routing — three layout groups

```
app/
  (auth)/          # login, register — unauthenticated only; redirects authed users away
  (app)/           # /dashboard/** — requires session; personal/business users
  (admin)/         # /admin/** — requires ADMIN or SUPER_ADMIN accountType
  widget/[txnId]/  # iframe embed; excluded from middleware; SameSite=None cookie
  t/[txnId]/       # direct share link (non-iframe counterparty flow)
  api/v1/          # REST API authenticated by API key (Bearer vl_live_*)
  claim/           # password set for shadow accounts and password reset
```

### Middleware lives in `proxy.ts`, not `middleware.ts`

The file exports `proxy` and `config`. It only decrypts the session JWT — no DB query — and guards `/dashboard` and `/admin`. The `/widget` and `/t/` paths are excluded from the matcher so the cookie check is skipped for those routes.

### Two acceptance flows — share link vs. widget

`/t/[txnId]` and `/widget/[txnId]` serve the same escrow but through different UX:
- `/t/` — counterparty opens a Vaultlify page in their own browser tab; standard cookie behaviour
- `/widget/` — embedded in a third-party iframe; requires `SameSite=None; Secure` on the session cookie (set in `lib/session.ts` based on `NODE_ENV`)

Both pages handle three viewer states: guest (no session, token present → show accept form), logged-in counterparty (one-click accept), and existing party (show status + action buttons).

### Server actions are the mutation layer

Every form submission and user action goes through a server action in `app/actions/`. Pages are server components that pass bound action functions to client components. The pattern is `useActionState(action, undefined)` in the client component.

- `auth.ts` — register, login, logout
- `transaction.ts` — create, accept, cancel, deliver, confirm, dispute (dashboard flow)
- `widget.ts` — accept as guest, accept as logged-in, deliver, confirm receipt (widget flow)
- `account.ts` — profile, password, business profile, API keys, webhooks, password reset
- `admin.ts` — admin-only actions (confirm payment, resolve dispute, fee config)

### Database — Prisma 7 + Neon serverless

`lib/db.ts` uses `@prisma/adapter-neon` with the WebSocket pooler. Use `DATABASE_URL` (pooled) in the app and `DATABASE_URL_UNPOOLED` only for `db push`/migrations.

Key schema relationships:
- `User` → `Business` (one-to-one, only for BUSINESS accounts)
- `User` → `TransactionParty[]` — a user's membership in transactions
- `Transaction` → `TransactionParty[]` — always exactly two parties (BUYER + SELLER)
- `Business` → `Webhook[]` and `FeeConfig` (optional override)
- `TransactionParty.isInitiator` — distinguishes who created the transaction from who joined

### Authentication — two systems

**Session (web):** JWT signed with `SESSION_SECRET`, stored in an `HttpOnly` cookie named `vl_session`. `getSession()` in `lib/session.ts` verifies the signature and rejects tokens issued before `user.passwordChangedAt`. `decryptSession()` is a lightweight variant (no DB query) used only in middleware.

**API key (REST):** `Bearer vl_live_*` tokens. `authenticateApiKey()` in `lib/api-auth.ts` does a prefix lookup (`apiKey.prefix`) to narrow to one candidate, then bcrypt-compares the full token against `apiKey.keyHash`. Returns `{ userId, keyId }`.

### Transaction fee resolution

`calculateFee()` in `lib/transaction/helpers.ts` checks for a business-specific `FeeConfig` override first, then falls back to the global platform default (`businessId: null`). The fee is snapshotted onto the transaction at creation time (`feeType`, `feeValue`, `feeAmount` columns).

### Invite tokens

`generateInviteToken()` signs a JWT containing `{ txnId, role, prefill? }`. Tokens expire in 7 days. The widget accepts a `token` query parameter but also works without one — when no token is present, the counterparty role is derived from the initiator's existing role via `getCounterpartyRole()`.

### Shadow accounts

When an unregistered user accepts an invite, a `User` row is created with `isClaimed: false`. They get a session cookie immediately. A 48-hour `claimToken` is emailed to them so they can set a password later via `/claim?token=...`. The claim and password-reset flows use separate token columns (`claimToken`/`claimTokenExp` vs `resetToken`/`resetTokenExp`).

### Webhooks and SSRF

`dispatchWebhooks()` in `lib/webhooks.ts` fans out to all active webhooks registered on businesses that are parties to the transaction. Before dispatching, URLs are filtered through `isSafeWebhookUrl()` (`lib/ssrf.ts`) which blocks private CIDRs, loopback, and cloud metadata endpoints. Payloads are signed with HMAC-SHA256 using the per-webhook secret.

### Two API integration modes

**Direct mode** — API key holder passes `role` and becomes a `TransactionParty` as `isInitiator: true`. They then call `POST /transactions/:id/invite` to bring in the counterparty.

**Marketplace (platform) mode** — API key holder passes `seller` and `buyer` objects. Vaultlify creates shadow accounts for both parties, records both as `TransactionParty`, and stores the API key holder's `userId` as `transaction.platformId`. The platform is **not** a party — they are the orchestrator. The transaction starts at `AWAITING_PAYMENT` immediately. Webhooks are routed to the platform's registered endpoints via `platformId`. Fee config is resolved from the platform's `Business.feeConfig`. See `app/api/v1/transactions/route.ts` — `handleMarketplace()` for the implementation.

### Email

`lib/email.ts` uses Resend. All user-controlled strings passed into HTML templates are escaped with `esc()` before insertion.

### Rate limiting

`lib/rate-limit.ts` is DB-backed (no Redis). Limits: 10 attempts per email address, 30 per IP, per 15-minute window. Records are written to the `LoginAttempt` table and cleaned up lazily.
