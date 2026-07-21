# Plan 02 — Paystack Payment End-to-End

**Status:** Complete (2026-07-21)  
**Repo:** `jojjy-gallery-app`  
**Effort:** L (2–4 days)  
**Blocks launch:** Yes  
**Depends on:** — (Plan 03 hooks into this webhook)

---

## Goal

Replace the **"Order created — payment coming soon"** stub with a working Paystack flow: checkout → Paystack popup/redirect → webhook verification → order status update → confirmation page.

Per scope doc (`docs/scope-v1-tickets-merch-crm.md`), Paystack is the v1 provider for tickets, merch, and artwork orders on the unified `Order` model.

---

## Current state

| Piece | Status |
| ----- | ------ |
| `pages/shop/[id].tsx` | Creates PENDING order via `POST /api/orders/checkout` with `paymentProvider: "PAYSTACK"` |
| `pages/api/orders/checkout.ts` | Validates items, creates `Order` + `OrderItem`, returns 201 — **no Paystack call** |
| Legacy M-Pesa | `pages/api/payment/checkout.ts` + `pages/api/mpesa/stkpush.ts` — sandbox, nesting bug, no callback |
| Schema | `Order.paystackRef`, `PaymentProvider.PAYSTACK`, `OrderStatus` enum |
| Cart drawer | Orphaned — `AddToCartButton` never imported |

**Decision:** Wire Paystack on the `Order` path. Deprecate (don't extend) legacy M-Pesa `Transaction` flow for v1 launch.

---

## Scope

### In scope

- Paystack Initialize Transaction API from checkout
- Paystack webhook handler (`charge.success`)
- Shop page: redirect to Paystack or embed `@paystack/inline-js`
- Order confirmation page `/shop/order/[id]` or `/account/orders/[id]`
- Env vars + Vercel config
- Idempotent webhook (duplicate events safe)

### Out of scope

- M-Pesa repair (defer or remove legacy path)
- Multi-item cart checkout (single artwork in shop v1 is fine)
- Paystack subscription / recurring

---

## Implementation steps

### Step 1 — Environment

Add to `.env.example` and Vercel:

```env
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...  # from Paystack dashboard
```

Run `npm run audit:env` after adding.

### Step 2 — Paystack client helper

Create `lib/paystack.ts`:

```ts
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in smallest currency unit (kobo/cents)
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }>
```

Use `POST https://api.paystack.co/transaction/initialize` with `Authorization: Bearer ${PAYSTACK_SECRET_KEY}`.

Amount: `Order.amount` is decimal — convert to kobo (`Math.round(amount * 100)`).

### Step 3 — Extend checkout API

Update `pages/api/orders/checkout.ts`:

1. After creating PENDING order, call `initializeTransaction`.
2. Store Paystack reference on order: `paystackRef: reference` (use order id or `order_${uuid}` as reference).
3. Return `{ orderId, authorizationUrl, accessCode }` instead of "payment coming soon".

Require user email from session (`session.user.email`).

### Step 4 — Shop page payment step

Update `pages/shop/[id].tsx`:

1. On successful checkout response, redirect to `authorizationUrl` **or** open Paystack inline popup with `access_code`.
2. Set `callbackUrl` to `/shop/confirmation?reference=...`.

Remove misleading "Creates a pending order" copy once live.

### Step 5 — Webhook handler

Create `pages/api/paystack/webhook.ts`:

1. Verify signature: `crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody)` vs `x-paystack-signature`.
2. On `charge.success`:
   - Find order by `paystackRef` / metadata `orderId`.
   - If already `PAID`, return 200 (idempotent).
   - Call fulfillment (Plan 03): update inventory, set `Order.status = PAID`.
3. On `charge.failed`: set `Order.status = FAILED` (add enum value if missing).

Use raw body parser config for this route only.

### Step 6 — Confirmation page

Create `pages/shop/confirmation.tsx`:

- Read `reference` from query.
- Verify via Paystack Verify API or trust webhook + poll order status.
- Show order summary, delivery details, next steps.

### Step 7 — Clean up legacy path

- Add comment in `pages/api/payment/checkout.ts`: deprecated for v1.
- Remove or hide cart drawer M-Pesa flow from navbar until rewired (optional).
- Do **not** delete M-Pesa files yet — mark deprecated in LAUNCH_CHECKLIST.

---

## Files to touch

| File | Change |
| ---- | ------ |
| `lib/paystack.ts` | **New** — initialize + verify |
| `pages/api/orders/checkout.ts` | Initialize Paystack after order create |
| `pages/api/paystack/webhook.ts` | **New** — webhook + signature verify |
| `pages/shop/[id].tsx` | Redirect/popup to Paystack |
| `pages/shop/confirmation.tsx` | **New** — success UI |
| `.env.example` | Paystack keys |
| `types/api.ts` | Checkout response types |

---

## Test plan

1. **Happy path:** Shop → checkout → Paystack test card `4084084084084081` → webhook → order `PAID` → confirmation page.
2. **Abandon:** Create PENDING order, don't pay — order stays PENDING; artwork still available.
3. **Duplicate webhook:** Send same event twice — no double fulfillment.
4. **Wrong amount:** Paystack amount must match order (initialize from server-side total only).
5. **Unauthenticated:** Checkout returns 401 without session.

---

## Acceptance criteria

- [ ] User can pay for an artwork in Studio Shop via Paystack test mode
- [ ] Webhook updates order to PAID
- [ ] Confirmation page shows paid order
- [ ] No client-side amount tampering (server computes total)
- [ ] Webhook signature verified in production

---

## Dependencies

- Plan 03 implements inventory updates inside webhook handler
- User must create Paystack account + set webhook URL in dashboard (`https://<domain>/api/paystack/webhook`)
