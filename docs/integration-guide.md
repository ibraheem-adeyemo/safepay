# Vaultlify Integration & Onboarding Guide

Vaultlify is a Nigerian escrow platform that holds payment in trust between a buyer and a seller until both sides confirm the deal is done. No money moves until both parties agree — protecting buyers from fraud and giving sellers confidence they will be paid.

---

## Table of Contents

1. [How Vaultlify Works](#1-how-vaultlify-works)
2. [Account Types](#2-account-types)
3. [Getting Started — Web Dashboard](#3-getting-started--web-dashboard)
4. [The Escrow Flow Step by Step](#4-the-escrow-flow-step-by-step)
5. [Transaction Statuses](#5-transaction-statuses)
6. [REST API — For Businesses](#6-rest-api--for-businesses)
7. [Embeddable Widget — For Businesses](#7-embeddable-widget--for-businesses)
   - [Marketplace / Platform mode widget flow](#marketplace--platform-mode-widget-flow)
   - [Direct mode widget flow](#direct-mode-widget-flow)
8. [Webhook Events](#8-webhook-events)
9. [Fees](#9-fees)
10. [Security Model](#10-security-model)
11. [Email Notifications](#11-email-notifications)

---

## 1. How Vaultlify Works

```
Initiator creates escrow  →  Counterparty accepts via invite link
       ↓
Buyer sends payment  →  Vaultlify holds funds
       ↓
Seller delivers  →  Buyer confirms receipt
       ↓
Vaultlify releases payment to seller
```

At any funded stage either party can raise a dispute. Vaultlify's team will review and decide the outcome.

---

## 2. Account Types

| Type | Who it's for | What they can do |
|---|---|---|
| **Personal** | Individual buyers and sellers | Create transactions, accept invites, manage their escrows |
| **Business** | Companies integrating Vaultlify | Everything above + API access, API keys, webhooks, custom fee config |
| **Shadow** | Counterparties who have not registered | Accept invites via email/link without a prior account; prompted to set a password afterwards |

Shadow accounts are created automatically when an unregistered counterparty accepts an invite. They receive an email with a link to set a password and claim their full account.

---

## 3. Getting Started — Web Dashboard

### 3.1 Register

Visit `https://vaultlify.com/register`. Choose **Personal** or **Business** during sign-up.

Business accounts get access to API keys, webhooks, and fee configuration under **Settings**.

### 3.2 Create your first transaction

1. Go to **Dashboard → Transactions → New Transaction**.
2. Fill in:
   - **Title** — describe what is being bought or sold (e.g. "iPhone 15 Pro 256GB").
   - **Amount** — minimum ₦500.
   - **Your role** — are you the **Buyer** or the **Seller**?
3. Click **Create**. Vaultlify creates the escrow and shows you an invite link.

### 3.3 Invite your counterparty

Copy the invite link from the transaction page and send it to the other party (WhatsApp, email, SMS — any channel).

When they open the link they will be asked to enter their name and email, then they join the transaction automatically. If they already have a Vaultlify account and are logged in, they join in one click.

### 3.4 Payment

Once both parties have joined, the transaction moves to **Awaiting Payment**. The buyer makes payment via bank transfer to Vaultlify's account (details provided on the transaction page). Vaultlify manually confirms receipt and moves the transaction to **Funded**.

### 3.5 Delivery and confirmation

1. The seller delivers the goods or service.
2. The seller clicks **Mark as Delivered** on the transaction page.
3. The buyer inspects and clicks **Confirm Receipt**.
4. Vaultlify releases the payment to the seller. The transaction is **Completed**.

### 3.6 Disputes

If something goes wrong after the transaction is funded, either party can click **Raise a Dispute**. The transaction is paused, and Vaultlify's team will review and contact both parties. The outcome will be either **Completed** (payment released to seller) or **Refunded** (payment returned to buyer).

---

## 4. The Escrow Flow Step by Step

```
CREATED
  │  Counterparty accepts invite link
  ▼
AWAITING_PAYMENT
  │  Buyer sends bank transfer; Vaultlify confirms
  ▼
FUNDED
  │  Seller marks as delivered
  ▼
DELIVERED
  │  Buyer confirms receipt
  ▼
COMPLETED ✓

At any point from FUNDED onwards either party can raise a dispute:
FUNDED / IN_PROGRESS / DELIVERED / UNDER_INSPECTION → DISPUTED
  │  Vaultlify resolves
  ▼
COMPLETED or REFUNDED

From CREATED or AWAITING_PAYMENT either party can cancel:
→ CANCELLED
```

---

## 5. Transaction Statuses

| Status | Meaning |
|---|---|
| `CREATED` | Escrow created, waiting for counterparty to join |
| `AWAITING_PAYMENT` | Both parties joined; buyer needs to send payment |
| `FUNDED` | Payment confirmed and held in escrow |
| `IN_PROGRESS` | Delivery underway (optional intermediate state) |
| `DELIVERED` | Seller has marked delivery; buyer must confirm |
| `UNDER_INSPECTION` | Buyer is inspecting (optional intermediate state) |
| `COMPLETED` | Buyer confirmed receipt; payment released to seller |
| `DISPUTED` | A dispute is open; Vaultlify is reviewing |
| `REFUNDED` | Dispute resolved in buyer's favour; funds returned |
| `CANCELLED` | Transaction cancelled before funding |

---

## 6. REST API — For Businesses

The REST API lets you create and manage escrow transactions programmatically — useful for marketplaces, e-commerce platforms, and any product where you want to initiate escrow on behalf of your users.

### 6.1 Authentication

All API requests require a Bearer token in the `Authorization` header.

```
Authorization: Bearer vl_live_<your-key>
```

Generate API keys from **Dashboard → Settings → API Keys**. A key is shown only once at creation — store it securely. You can create multiple keys with labels (e.g. "Production", "Staging").

Keys are hashed on the server — if you lose a key, deactivate it and generate a new one.

### 6.2 Base URL

```
https://vaultlify.com/api/v1
```

### 6.3 Endpoints

#### List transactions

```
GET /transactions
```

Query parameters:

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter by status (see §5) |
| `limit` | number | 20 | Max 100 |
| `offset` | number | 0 | Pagination offset |

Response:

```json
{
  "data": [ ...transactions ],
  "meta": { "total": 42, "limit": 20, "offset": 0 }
}
```

---

#### Create a transaction

```
POST /transactions
Content-Type: application/json
```

There are two modes depending on whether your platform is one of the parties or an orchestrator acting on behalf of two of your own users.

---

**Direct mode** — you are one of the parties (e.g. you are the seller)

```json
{
  "title": "MacBook Pro 14\" M3",
  "description": "Space grey, 512GB SSD, 2024 model",
  "amount": 950000,
  "role": "SELLER"
}
```

| Field | Required | Description |
|---|---|---|
| `title` | Yes | What is being bought or sold (2–200 chars) |
| `description` | No | Additional detail (max 500 chars) |
| `amount` | Yes | Amount in naira (minimum 500) |
| `role` | Yes | `"BUYER"` or `"SELLER"` — your role in this deal |

Response `201` — transaction starts at `CREATED`. You then call `POST /transactions/:id/invite` to get the counterparty's invite link.

```json
{
  "data": {
    "id": "clx...",
    "reference": "VLT-20260713-A3K2P",
    "title": "MacBook Pro 14\" M3",
    "amount": "950000.00",
    "status": "CREATED",
    "currency": "NGN",
    "feeAmount": "9500.00",
    "parties": [ { "role": "SELLER", "userId": "...", "isInitiator": true } ]
  }
}
```

---

**Marketplace mode** — your platform orchestrates a deal between two of your own users

Use this when you are a marketplace (e.g. Jumia, Jiji) and the buyer and seller are both your users — not your platform itself. Pass both parties upfront; no invite step is needed.

```json
{
  "title": "iPhone 15 Pro",
  "description": "256GB, Black Titanium",
  "amount": 950000,
  "seller": { "name": "Emeka Okonkwo", "email": "emeka@gmail.com", "phone": "+2348012345678" },
  "buyer":  { "name": "Amaka Okafor",  "email": "amaka@gmail.com" }
}
```

| Field | Required | Description |
|---|---|---|
| `title` | Yes | What is being bought or sold (2–200 chars) |
| `description` | No | Additional detail (max 500 chars) |
| `amount` | Yes | Amount in naira (minimum 500) |
| `seller` | Yes | Seller identity — `name` (required), `email` (required), `phone` (optional) |
| `buyer` | Yes | Buyer identity — same fields as `seller` |

Vaultlify automatically:
- Creates shadow accounts for the seller and buyer if they don't already exist
- Sends both a 48-hour link to set a password and access their Vaultlify dashboard
- Records your platform as the orchestrator — you are **not** a party to the transaction
- Applies your platform's custom fee configuration

Response `201` — transaction starts immediately at `AWAITING_PAYMENT` (both parties are already in):

```json
{
  "data": {
    "id": "clx...",
    "reference": "VLT-20260713-X9K2P",
    "title": "iPhone 15 Pro",
    "amount": "950000.00",
    "status": "AWAITING_PAYMENT",
    "currency": "NGN",
    "feeAmount": "9500.00",
    "parties": [
      { "role": "SELLER", "userId": "...", "isInitiator": true },
      { "role": "BUYER",  "userId": "...", "isInitiator": false }
    ],
    "sellerWidgetUrl": "https://vaultlify.com/widget/clx...",
    "buyerWidgetUrl":  "https://vaultlify.com/widget/clx..."
  }
}
```

Embed `buyerWidgetUrl` in your product page so the buyer can track the escrow and confirm receipt without leaving your site. Embed `sellerWidgetUrl` on the seller's order page so they can mark delivery. No invite token is needed — both parties are already registered on the transaction.

Your platform's registered webhooks receive every event for all transactions you orchestrate, even though you are not listed as a party.

---

#### Get a transaction

```
GET /transactions/:id
```

Returns the transaction with its full status log. Only returns transactions where the API key owner is a party or the platform orchestrator.

---

#### Generate an invite link

```
POST /transactions/:id/invite
Content-Type: application/json
```

Body:

```json
{ "role": "BUYER" }
```

The `role` must be the counterparty's role (opposite of yours). Returns:

```json
{
  "data": {
    "token": "<signed-jwt>",
    "role": "BUYER",
    "widgetUrl": "https://vaultlify.com/widget/clx...?token=<token>",
    "shareUrl": "https://vaultlify.com/t/clx...?token=<token>",
    "expiresIn": "7 days"
  }
}
```

- **`shareUrl`** — send this to your counterparty. They see Vaultlify's standard accept-and-join page.
- **`widgetUrl`** — embed this in an iframe inside your own product (see §7).

Tokens expire in **7 days**. Call this endpoint again to generate a fresh token.

---

#### Mark as delivered (seller only)

```
POST /transactions/:id/deliver
```

Moves status from `FUNDED` or `IN_PROGRESS` → `DELIVERED`. Only valid when the API key owner is the SELLER on this transaction.

---

#### Confirm receipt (buyer only)

```
POST /transactions/:id/confirm
```

Moves status from `DELIVERED` or `UNDER_INSPECTION` → `COMPLETED`. Only valid when the API key owner is the BUYER on this transaction.

---

#### Cancel a transaction

```
POST /transactions/:id/cancel
```

Only possible from `CREATED` or `AWAITING_PAYMENT`. Either party can cancel.

---

### 6.4 Error format

All errors follow the same shape:

```json
{ "error": "Unauthorized" }
```

Validation errors include field-level details:

```json
{
  "error": "Validation failed",
  "details": {
    "amount": ["Minimum amount is ₦500."],
    "role": ["Invalid enum value"]
  }
}
```

| HTTP Status | Meaning |
|---|---|
| 401 | Missing or invalid API key |
| 404 | Transaction not found or you are not a party |
| 409 | Action not valid at this status |
| 422 | Validation failed — see `details` |

---

## 7. Embeddable Widget — For Businesses

The widget lets your users accept a transaction and track its status entirely inside an `<iframe>` embedded in your product — they never leave your site.

There are **two widget flows** depending on which API mode you used to create the transaction:

| | **Direct mode** | **Marketplace / Platform mode** |
|---|---|---|
| Who calls the API? | You (as one of the parties) | You (as the platform orchestrator) |
| Invite step needed? | Yes — call `/invite` to get the widget URL | No — widget URLs are returned immediately |
| Widget URL format | `…/widget/:id?token=<jwt>` | `…/widget/:id` (no token) |
| Accept form shown? | Yes, to the counterparty | No — both parties are already joined |
| `platformId` set? | No | Yes — your user ID is stored as the orchestrator |

---

### Marketplace / Platform mode widget flow

Use this flow when you called `POST /transactions` with `seller` and `buyer` objects. Both parties are already registered on the transaction — no invite or accept step is needed.

---

#### Step 1 — Create the transaction

Your server calls `POST /api/v1/transactions` with both parties:

```json
{
  "title": "Nike Air Force 1",
  "amount": 85000,
  "seller": { "name": "Tunde Bello",  "email": "tunde@seller.com", "phone": "+2348011111111" },
  "buyer":  { "name": "Ngozi Eze",    "email": "ngozi@buyer.com" }
}
```

The response comes back at `AWAITING_PAYMENT` with both widget URLs ready:

```json
{
  "data": {
    "id": "clx...",
    "reference": "VLT-20260713-X9K2P",
    "status": "AWAITING_PAYMENT",
    "platformId": "usr_your-platform-user-id",
    "sellerWidgetUrl": "https://vaultlify.com/widget/clx...",
    "buyerWidgetUrl":  "https://vaultlify.com/widget/clx...",
    "parties": [
      { "role": "SELLER", "userId": "...", "isInitiator": true },
      { "role": "BUYER",  "userId": "...", "isInitiator": false }
    ]
  }
}
```

`platformId` is automatically set to your API key's user ID. Your platform is **not** a party — you are the orchestrator. Your registered webhooks receive every event for all transactions you orchestrate.

---

#### Step 2 — Embed both widget URLs

Embed each URL for the correct user. The widget detects that the viewer is already a party and skips the accept form entirely — it shows the status card, parties list, timeline, and action buttons appropriate to their role.

**On the seller's order page:**

```html
<iframe
  src="https://vaultlify.com/widget/clx..."
  width="480"
  height="640"
  style="border: none; border-radius: 16px;"
  allow="payment"
></iframe>
```

**On the buyer's order page:**

```html
<iframe
  src="https://vaultlify.com/widget/clx..."
  width="480"
  height="640"
  style="border: none; border-radius: 16px;"
  allow="payment"
></iframe>
```

> **Note:** `sellerWidgetUrl` and `buyerWidgetUrl` currently resolve to the same URL (`/widget/:id` with no token). The widget determines what to show based on the viewer's session cookie. Embed the same URL for both — each party will see their own role-appropriate view.

---

#### Step 3 — What the widget shows

Because both parties are already registered, the widget skips the accept form and renders immediately:

| Viewer | Widget shows |
|---|---|
| Seller (logged in) | Status card, parties, timeline, **"Mark as Delivered"** button once funded |
| Buyer (logged in) | Status card, parties, timeline, **"Confirm Receipt"** button once delivered |
| Either party (not logged in) | Locked — "Sign in to view this transaction" prompt |

The seller and buyer received an email at transaction creation with a link to set their password. Once claimed, they stay logged in via cookie and will see the widget with their correct role automatically.

---

#### Step 4 — postMessage events

The widget fires the same `postMessage` events regardless of mode. Because there is no accept step, `vaultlify:accepted` and `vaultlify:formReady` are never fired — the transaction is already at `AWAITING_PAYMENT`. Listen for the remaining events:

```js
window.addEventListener("message", (event) => {
  const { type, transactionId, status } = event.data;

  switch (type) {
    case "vaultlify:ready":
      // Widget rendered — status will be "AWAITING_PAYMENT"
      break;

    case "vaultlify:delivered":
      // Seller marked as delivered
      break;

    case "vaultlify:completed":
      // Buyer confirmed receipt — release any platform-side holds
      break;

    case "vaultlify:cancelled":
      // Transaction was cancelled
      break;
  }
});
```

> The `prefill` postMessage command and `vaultlify:formReady` / `vaultlify:accepted` events are **not applicable** in marketplace mode. Those are part of the guest accept flow that only exists in Direct mode.

---

#### Step 5 — Webhooks

Your platform receives webhook events for every transaction where `platformId` equals your user ID, even though you are not listed as a party. Wire up your webhook endpoint (Settings → Webhooks) to track payment, delivery, and completion server-side — this is the reliable record regardless of whether either user ever opens the widget.

```json
{
  "event": "transaction.completed",
  "txnId": "clx...",
  "data": { "transaction": { "id": "clx...", "status": "COMPLETED" } },
  "timestamp": "2026-07-13T10:00:00.000Z"
}
```

---

### Direct mode widget flow

Use this flow when you called `POST /transactions` with `role` — you are one of the parties and the counterparty still needs to accept.

---

### A — Business creates a transaction via the API

Your server calls `POST /api/v1/transactions` with your API key:

```json
{ "title": "MacBook Air M3", "amount": 950000, "role": "SELLER" }
```

Vaultlify creates the transaction in the database with status `CREATED`, records your account as the initiator (SELLER), and returns the transaction ID.

---

### B — Business generates the invite link

Your server calls `POST /api/v1/transactions/:id/invite` with `{ "role": "BUYER" }`.

Vaultlify signs a JWT containing the transaction ID and the counterparty's role, then returns:

```json
{
  "token": "<signed-jwt>",
  "widgetUrl": "https://vaultlify.com/widget/clx...?token=<token>",
  "shareUrl": "https://vaultlify.com/t/clx...?token=<token>",
  "expiresIn": "7 days"
}
```

Use `widgetUrl` for the iframe embed. Use `shareUrl` if you want to send the counterparty a plain link instead (e.g. via SMS or email).

---

### C — Business embeds the iframe

Drop the `widgetUrl` into your page:

```html
<iframe
  src="https://vaultlify.com/widget/clx...?token=<token>"
  width="480"
  height="640"
  style="border: none; border-radius: 16px;"
  allow="payment"
></iframe>
```

The counterparty sees the full escrow UI without ever leaving your site.

---

### D — Widget page loads (server-side)

`/widget/[txnId]` is a server-rendered page. On every load it:

1. Reads `token` and `joined` from the URL query string
2. Fetches the full transaction from the database — including all parties and status logs
3. Reads the visitor's session cookie (if they are already logged in to Vaultlify)
4. Verifies the JWT token — checks the signature is valid and the `txnId` inside the token matches the URL
5. Decides what to render based on who is viewing:

| Condition | What the widget shows |
|---|---|
| Valid token + counterparty slot empty + no session | Guest accept form (name, email, phone) |
| Valid token + counterparty slot empty + logged in | One-click "Accept as BUYER" button |
| Visitor is already a party to the transaction | Status card, timeline, and action buttons (deliver / confirm) |
| None of the above | Locked state — "sign in to view details" |

---

### E — Counterparty accepts (guest path)

The guest fills in their name, email, and optionally phone number, then submits the form.

This triggers the `widgetAcceptAsGuest` server action, which is pre-bound to the transaction ID and invite token. The action runs these steps in order:

1. Re-verifies the JWT invite token (guards against replays after the token has expired)
2. Validates the form fields with Zod — rejects empty or malformed inputs
3. Checks whether the email already belongs to a fully claimed Vaultlify account. If it does, redirects to `/login` with a callback URL pointing back to the widget so the logged-in user can accept in one click
4. Otherwise, finds or creates a **shadow account** (`isClaimed: false`) for the counterparty — a real database user record, but without a password yet
5. If the shadow account already existed but was unclaimed, updates the name and phone from the form
6. Creates a `TransactionParty` record linking the counterparty to the transaction as BUYER
7. Moves the transaction status from `CREATED` → `AWAITING_PAYMENT` and writes a status log entry
8. Sends `notifyCounterpartyJoined` — an email to the initiator saying their counterparty has joined
9. Sends `notifyYouJoined` — an email to the counterparty confirming they have joined and showing the amount
10. If the shadow account was brand new, generates a 48-hour claim token, saves it to the database, and emails the counterparty a link to `/claim?token=...` so they can set a password and access their full dashboard later
11. Creates a session cookie for the counterparty — they are now "logged in" as the shadow account for the rest of this browser session
12. Dispatches webhook events to your registered webhook URL (`transaction.created` event, signed with HMAC-SHA256)
13. Redirects the iframe to `/widget/clx...?joined=1`

---

### F — Widget page reloads with `?joined=1`

The server component re-renders. This time:

- The counterparty exists in the database as a party — the widget shows their name in the parties section
- The `joined=1` query param triggers a green success banner: *"You've joined this transaction!"*
- The status card now shows `AWAITING_PAYMENT`

A small client component called `WidgetEvents` (invisible in the UI) runs a `useEffect` and fires two `postMessage` events to the parent page:

```js
window.parent.postMessage({ type: "vaultlify:ready", transactionId, status }, "*");
window.parent.postMessage({ type: "vaultlify:accepted", transactionId, status }, "*");
```

---

### G — Business's page receives and sends postMessage events

The widget fires events outward AND listens for commands inward. Your page must handle both directions.

#### Receiving events from the widget

```js
window.addEventListener("message", (event) => {
  // Filter by message type — do NOT filter by origin.
  // The widget is served from vaultlify.com but your page may be on any domain,
  // and origin-based filtering on the receiver side does nothing useful here.
  const { type, transactionId, status } = event.data;

  switch (type) {
    case "vaultlify:ready":
      // Widget page rendered — `status` holds the current transaction status.
      // Use this to know the iframe is alive, but do NOT send prefill here —
      // React hasn't hydrated yet so the form listener isn't registered.
      break;

    case "vaultlify:formReady":
      // The accept form has mounted and its message listener is registered.
      // THIS is the correct moment to send prefill data (see below).
      sendPrefill();
      break;

    case "vaultlify:accepted":
      // Counterparty accepted — update your UI to "Awaiting payment"
      break;

    case "vaultlify:delivered":
      // Seller marked as delivered — prompt buyer to inspect
      break;

    case "vaultlify:completed":
      // Buyer confirmed receipt — payment releasing to seller
      break;

    case "vaultlify:cancelled":
      // Transaction was cancelled
      break;
  }
});
```

#### Sending prefill data to the widget (postMessage path)

**Critical:** send prefill only after receiving `vaultlify:formReady` — not on `iframe.onLoad`.

`onLoad` fires when the initial HTML arrives, before React has hydrated and the form's event listener exists. Messages sent at that point are silently dropped. `vaultlify:formReady` is emitted by the form component itself, immediately after its listener is registered — so it is guaranteed to arrive after the listener is ready.

```js
const iframe = document.getElementById("vaultlify-widget");

function sendPrefill() {
  iframe.contentWindow.postMessage(
    {
      type: "prefill",
      data: {
        name: "Amaka Okafor",
        email: "amaka@yourplatform.com",
        phone: "+2348012345678",
      },
    },
    "https://vaultlify.com" // targetOrigin — locks delivery to the Vaultlify iframe only
  );
}

window.addEventListener("message", (event) => {
  if (event.data?.type === "vaultlify:formReady") {
    sendPrefill();
  }
  // ... other event handlers
});
```

**postMessage event reference** — widget → parent:

| Event | Payload | When fired |
|---|---|---|
| `vaultlify:ready` | `{ transactionId, status }` | Widget page rendered (before React hydration) |
| `vaultlify:formReady` | `{}` | Accept form mounted, ready to receive prefill |
| `vaultlify:accepted` | `{ transactionId, status }` | Counterparty accepted the invite |
| `vaultlify:delivered` | `{ transactionId }` | Seller clicked "Mark as Delivered" |
| `vaultlify:completed` | `{ transactionId }` | Buyer clicked "Confirm Receipt" |
| `vaultlify:cancelled` | `{ transactionId }` | Transaction cancelled |

**postMessage command reference** — parent → widget:

| Message | Payload | Effect |
|---|---|---|
| `prefill` | `{ data: { name?, email?, phone? } }` | Pre-fills form fields that are still empty |

> **Note:** `vaultlify:formReady` is only emitted when the accept form is visible — i.e. a valid invite token is present and the counterparty slot is empty. If the widget is showing a transaction in progress (both parties already joined), the form never renders and `vaultlify:formReady` is never sent.

At this point you can update your own UI, mark the order as "pending payment" in your database, send your own notification, etc.

---

### H — Payment, delivery, and confirmation

From here every remaining step follows the same server-action → status-change → postMessage loop:

| Step | Who acts | What happens in Vaultlify | Status transition | postMessage fired |
|---|---|---|---|---|
| **Payment** | Buyer sends bank transfer; Vaultlify admin confirms | `adminConfirmPayment` runs, writes a payment record | `AWAITING_PAYMENT` → `FUNDED` | — |
| **Deliver** | Seller clicks "Mark as Delivered" inside the widget | `widgetMarkDelivered` runs, notifies buyer by email | `FUNDED` → `DELIVERED` | `vaultlify:delivered` |
| **Confirm** | Buyer clicks "Confirm Receipt" inside the widget | `widgetConfirmReceipt` runs, notifies seller by email | `DELIVERED` → `COMPLETED` | `vaultlify:completed` |

Each of these server actions also dispatches a webhook event to your registered endpoint — signed with HMAC-SHA256 — so your backend can react even if the user has closed the browser tab.

---

### Summary — two communication channels

The widget uses two independent channels to keep your product informed:

| Channel | Direction | Best for |
|---|---|---|
| `window.parent.postMessage` | Widget iframe → your page (in the browser) | Real-time UI updates — show a spinner, change a status badge, play a sound |
| Webhooks (`X-Vaultlify-Signature`) | Vaultlify server → your server | Reliable backend updates — record the event in your database regardless of browser state |

Use both. The `postMessage` events update the user's screen immediately. The webhooks are the source of truth for your backend — they arrive even if the user closes the tab mid-flow.

---

### Shadow accounts and claiming

When a counterparty joins via the widget without an existing account, Vaultlify automatically:

1. Creates a shadow account (`isClaimed: false`) — a real user record with no password
2. Gives them a session cookie so they stay authenticated for the current browser session
3. Emails them a 48-hour claim link (`/claim?token=...`) to set a password

Once they claim their account they get full access to the Vaultlify dashboard — all past transactions, notifications, and settings. This is fully automatic; you do not need to handle any part of it.

---

## 8. Webhook Events

Webhooks push real-time event notifications to your server. Configure them from **Dashboard → Settings → Webhooks**.

### 8.1 Setup

- URL must be `https://`.
- Select which events you want to receive.
- A signing secret is generated for you — use it to verify payloads (see §8.3).

### 8.2 Available events

| Event | Triggered when |
|---|---|
| `transaction.created` | A new transaction is created |
| `transaction.funded` | Payment is confirmed and held in escrow |
| `transaction.delivered` | Seller marks the item as delivered |
| `transaction.completed` | Buyer confirms receipt |
| `transaction.disputed` | Either party raises a dispute |
| `transaction.cancelled` | Transaction is cancelled |
| `payment.confirmed` | Admin manually confirms a payment |
| `dispute.resolved` | Admin resolves a dispute |

### 8.3 Payload format

```json
{
  "event": "transaction.completed",
  "txnId": "clx...",
  "data": {
    "transaction": {
      "id": "clx...",
      "title": "MacBook Pro",
      "status": "COMPLETED"
    }
  },
  "timestamp": "2026-05-12T10:00:00.000Z"
}
```

### 8.4 Verifying the signature

Every webhook request includes an `X-Vaultlify-Signature` header:

```
X-Vaultlify-Signature: sha256=<hmac-hex>
```

Verify it before processing:

```js
const crypto = require("crypto");

function verifyWebhook(rawBody, signature, secret) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)          // raw bytes, not parsed JSON
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

Reject any request where the signature does not match.

#### Replay protection

Every webhook payload includes a `timestamp` field (ISO 8601). After verifying the signature, check that the timestamp is within 5 minutes of your server's current time. Reject anything older — this prevents an attacker who captured a legitimate payload from replaying it later.

```js
function verifyWebhook(rawBody, signature, secret) {
  const payload = JSON.parse(rawBody);

  // 1. Reject stale payloads
  const age = Date.now() - new Date(payload.timestamp).getTime();
  if (age > 5 * 60 * 1000) throw new Error("Webhook timestamp too old");

  // 2. Verify signature
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid webhook signature");
  }

  return payload;
}
```

---

## 9. Fees

Vaultlify charges an escrow fee on each transaction. The fee is calculated at the time of transaction creation and held alongside the escrowed amount.

- **Default** — percentage-based fee applied to all transactions.
- **Business override** — Vaultlify can configure a custom fee (fixed or percentage) or a zero-fee arrangement for specific business accounts. Contact support to discuss volume pricing.

The fee amount is returned in the transaction object as `feeAmount` (in naira). Buyers should factor this into the total amount they send.

---

## 10. Security Model

### API keys

- Keys are stored as bcrypt hashes — Vaultlify never has access to your raw key.
- Each key has a short prefix (e.g. `vl_live_abc1234`) stored in plaintext for fast lookup; the full key is only compared after that prefix match.
- Deactivate compromised keys immediately from the dashboard. Old keys cannot be recovered.

### Invite tokens

- Invite links embed a signed JWT (HMAC-SHA256) containing the transaction ID and the counterparty's role.
- Tokens expire after **7 days**.
- A token can only be used for the specific transaction it was issued for.
- If a slot is already filled the token is rejected, even if it is otherwise valid.

### Sessions

- Sessions are stored in encrypted, `HttpOnly` cookies. They cannot be read by JavaScript.
- Shadow-account claim tokens expire after **48 hours** and are cleared from the database once used.

### Webhooks

- Payloads are signed with HMAC-SHA256 using a per-webhook secret.
- Always verify the signature before trusting the payload (see §8.4).
- Webhook deliveries have a 5-second timeout. Vaultlify does not retry failed deliveries — build idempotent handlers and poll the API if you miss an event.

---

## 11. Email Notifications

Vaultlify sends transactional emails for every key event. No configuration is needed — emails go to the address associated with each party's account.

| Trigger | Who receives it |
|---|---|
| Transaction created | Initiator |
| Counterparty joined | Initiator |
| You joined a transaction | Joiner |
| Payment confirmed | Both parties |
| Item marked as delivered | Buyer |
| Transaction completed | Seller |
| Dispute raised | Both parties |
| Dispute resolved | Both parties |
| Transaction cancelled | Both parties |
| Shadow account created | Counterparty (claim link, expires 48h) |

---

## Quick-start checklist

### Personal user

- [ ] Register at `https://vaultlify.com/register`
- [ ] Create a transaction (Dashboard → Transactions → New)
- [ ] Copy and send the invite link to the other party
- [ ] Wait for counterparty to join, then send payment per instructions on the transaction page
- [ ] Confirm receipt once goods arrive

### Business integrating via API (direct mode)

- [ ] Register with account type **Business** and complete your business profile
- [ ] Go to **Settings → API Keys** and generate a key — copy it now, it won't be shown again
- [ ] `POST /api/v1/transactions` with `role` to create your first escrow
- [ ] `POST /api/v1/transactions/:id/invite` to get the counterparty's invite link
- [ ] Optionally embed the `widgetUrl` in an iframe and listen for `postMessage` events
- [ ] Go to **Settings → Webhooks**, add your endpoint URL, and verify signatures in your handler

### Marketplace integrating via API (platform mode)

- [ ] Register with account type **Business** and complete your business profile
- [ ] Go to **Settings → API Keys** and generate a key
- [ ] `POST /api/v1/transactions` with `seller` and `buyer` objects to create a transaction on behalf of your users
- [ ] Embed `sellerWidgetUrl` on the seller's order page and `buyerWidgetUrl` on the buyer's order page
- [ ] Go to **Settings → Webhooks**, add your endpoint URL — your platform receives all events for all orchestrated transactions
- [ ] Optionally prefill the widget form using `postMessage` so users don't have to type their details again

---

*For support, contact the Vaultlify team or open an issue.*
