# SafePay Integration & Onboarding Guide

SafePay is a Nigerian escrow platform that holds payment in trust between a buyer and a seller until both sides confirm the deal is done. No money moves until both parties agree — protecting buyers from fraud and giving sellers confidence they will be paid.

---

## Table of Contents

1. [How SafePay Works](#1-how-safepay-works)
2. [Account Types](#2-account-types)
3. [Getting Started — Web Dashboard](#3-getting-started--web-dashboard)
4. [The Escrow Flow Step by Step](#4-the-escrow-flow-step-by-step)
5. [Transaction Statuses](#5-transaction-statuses)
6. [REST API — For Businesses](#6-rest-api--for-businesses)
7. [Embeddable Widget — For Businesses](#7-embeddable-widget--for-businesses)
8. [Webhook Events](#8-webhook-events)
9. [Fees](#9-fees)
10. [Security Model](#10-security-model)
11. [Email Notifications](#11-email-notifications)

---

## 1. How SafePay Works

```
Initiator creates escrow  →  Counterparty accepts via invite link
       ↓
Buyer sends payment  →  SafePay holds funds
       ↓
Seller delivers  →  Buyer confirms receipt
       ↓
SafePay releases payment to seller
```

At any funded stage either party can raise a dispute. SafePay's team will review and decide the outcome.

---

## 2. Account Types

| Type | Who it's for | What they can do |
|---|---|---|
| **Personal** | Individual buyers and sellers | Create transactions, accept invites, manage their escrows |
| **Business** | Companies integrating SafePay | Everything above + API access, API keys, webhooks, custom fee config |
| **Shadow** | Counterparties who have not registered | Accept invites via email/link without a prior account; prompted to set a password afterwards |

Shadow accounts are created automatically when an unregistered counterparty accepts an invite. They receive an email with a link to set a password and claim their full account.

---

## 3. Getting Started — Web Dashboard

### 3.1 Register

Visit `https://safepay.ng/register`. Choose **Personal** or **Business** during sign-up.

Business accounts get access to API keys, webhooks, and fee configuration under **Settings**.

### 3.2 Create your first transaction

1. Go to **Dashboard → Transactions → New Transaction**.
2. Fill in:
   - **Title** — describe what is being bought or sold (e.g. "iPhone 15 Pro 256GB").
   - **Amount** — minimum ₦500.
   - **Your role** — are you the **Buyer** or the **Seller**?
3. Click **Create**. SafePay creates the escrow and shows you an invite link.

### 3.3 Invite your counterparty

Copy the invite link from the transaction page and send it to the other party (WhatsApp, email, SMS — any channel).

When they open the link they will be asked to enter their name and email, then they join the transaction automatically. If they already have a SafePay account and are logged in, they join in one click.

### 3.4 Payment

Once both parties have joined, the transaction moves to **Awaiting Payment**. The buyer makes payment via bank transfer to SafePay's account (details provided on the transaction page). SafePay manually confirms receipt and moves the transaction to **Funded**.

### 3.5 Delivery and confirmation

1. The seller delivers the goods or service.
2. The seller clicks **Mark as Delivered** on the transaction page.
3. The buyer inspects and clicks **Confirm Receipt**.
4. SafePay releases the payment to the seller. The transaction is **Completed**.

### 3.6 Disputes

If something goes wrong after the transaction is funded, either party can click **Raise a Dispute**. The transaction is paused, and SafePay's team will review and contact both parties. The outcome will be either **Completed** (payment released to seller) or **Refunded** (payment returned to buyer).

---

## 4. The Escrow Flow Step by Step

```
CREATED
  │  Counterparty accepts invite link
  ▼
AWAITING_PAYMENT
  │  Buyer sends bank transfer; SafePay confirms
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
  │  SafePay resolves
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
| `DISPUTED` | A dispute is open; SafePay is reviewing |
| `REFUNDED` | Dispute resolved in buyer's favour; funds returned |
| `CANCELLED` | Transaction cancelled before funding |

---

## 6. REST API — For Businesses

The REST API lets you create and manage escrow transactions programmatically — useful for marketplaces, e-commerce platforms, and any product where you want to initiate escrow on behalf of your users.

### 6.1 Authentication

All API requests require a Bearer token in the `Authorization` header.

```
Authorization: Bearer sp_live_<your-key>
```

Generate API keys from **Dashboard → Settings → API Keys**. A key is shown only once at creation — store it securely. You can create multiple keys with labels (e.g. "Production", "Staging").

Keys are hashed on the server — if you lose a key, deactivate it and generate a new one.

### 6.2 Base URL

```
https://safepay.ng/api/v1
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

Body:

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

Response `201`:

```json
{
  "data": {
    "id": "clx...",
    "reference": "SPY-20260512-A3K2P",
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

#### Get a transaction

```
GET /transactions/:id
```

Returns the transaction with its full status log. Only returns transactions where the API key owner is a party.

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
    "widgetUrl": "https://safepay.ng/widget/clx...?token=<token>",
    "shareUrl": "https://safepay.ng/t/clx...?token=<token>",
    "expiresIn": "7 days"
  }
}
```

- **`shareUrl`** — send this to your counterparty. They see SafePay's standard accept-and-join page.
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

The widget lets your counterparty accept a transaction and track its status entirely inside an `<iframe>` embedded in your product — they never leave your site.

### 7.1 Embed the iframe

After creating a transaction and generating an invite link (§6.3), embed the `widgetUrl`:

```html
<iframe
  src="https://safepay.ng/widget/TRANSACTION_ID?token=INVITE_TOKEN"
  width="480"
  height="640"
  style="border: none; border-radius: 16px;"
  allow="payment"
></iframe>
```

### 7.2 postMessage events

The widget fires `window.parent.postMessage` events so your page can react to state changes without polling the API.

Listen for events:

```js
window.addEventListener("message", (event) => {
  if (event.origin !== "https://safepay.ng") return; // always verify origin

  const { type, txnId, status } = event.data;

  switch (type) {
    case "safepay:joined":
      // Counterparty accepted the invite
      break;
    case "safepay:delivered":
      // Seller marked as delivered
      break;
    case "safepay:completed":
      // Buyer confirmed receipt — deal is done
      break;
    case "safepay:status":
      // General status update — check `status` field
      break;
  }
});
```

| Event | When fired |
|---|---|
| `safepay:joined` | Counterparty accepted the invite |
| `safepay:delivered` | Seller clicked "Mark as Delivered" |
| `safepay:completed` | Buyer clicked "Confirm Receipt" |
| `safepay:status` | Any other status change |

### 7.3 Shadow accounts in the widget

When a counterparty joins via the widget without an existing account, SafePay silently creates a shadow account for them. After joining they receive an email with a link to set a password and access their full SafePay dashboard. This is fully automatic — you do not need to handle it.

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

Every webhook request includes an `X-SafePay-Signature` header:

```
X-SafePay-Signature: sha256=<hmac-hex>
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

---

## 9. Fees

SafePay charges an escrow fee on each transaction. The fee is calculated at the time of transaction creation and held alongside the escrowed amount.

- **Default** — percentage-based fee applied to all transactions.
- **Business override** — SafePay can configure a custom fee (fixed or percentage) or a zero-fee arrangement for specific business accounts. Contact support to discuss volume pricing.

The fee amount is returned in the transaction object as `feeAmount` (in naira). Buyers should factor this into the total amount they send.

---

## 10. Security Model

### API keys

- Keys are stored as bcrypt hashes — SafePay never has access to your raw key.
- Each key has a short prefix (e.g. `sp_live_abc1234`) stored in plaintext for fast lookup; the full key is only compared after that prefix match.
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
- Webhook deliveries have a 5-second timeout. SafePay does not retry failed deliveries — build idempotent handlers and poll the API if you miss an event.

---

## 11. Email Notifications

SafePay sends transactional emails for every key event. No configuration is needed — emails go to the address associated with each party's account.

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

- [ ] Register at `https://safepay.ng/register`
- [ ] Create a transaction (Dashboard → Transactions → New)
- [ ] Copy and send the invite link to the other party
- [ ] Wait for counterparty to join, then send payment per instructions on the transaction page
- [ ] Confirm receipt once goods arrive

### Business integrating via API

- [ ] Register with account type **Business** and complete your business profile
- [ ] Go to **Settings → API Keys** and generate a key — copy it now, it won't be shown again
- [ ] `POST /api/v1/transactions` to create your first escrow
- [ ] `POST /api/v1/transactions/:id/invite` to get the counterparty's invite link
- [ ] Optionally embed the `widgetUrl` in an iframe and listen for `postMessage` events
- [ ] Go to **Settings → Webhooks**, add your endpoint URL, and verify signatures in your handler

---

*For support, contact the SafePay team or open an issue.*
