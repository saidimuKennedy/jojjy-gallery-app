# Plan 03 — Inventory & Order Fulfillment

**Status:** Complete (2026-07-21)  
**Repo:** `jojjy-gallery-app`  
**Effort:** M (1–2 days)  
**Blocks launch:** Yes  
**Depends on:** [Plan 02 — Paystack](./02-paystack-payment-end-to-end.md)

---

## Goal

When payment succeeds, atomically:

1. Mark the order **PAID**
2. Update inventory (artwork sold, ticket qty, variant stock)
3. Issue tickets (if applicable)
4. Send order confirmation email

Today checkout **validates** stock but never **commits** changes.

---

## Current state

| Item type | Validation in checkout | Post-payment update |
| --------- | ---------------------- | ------------------- |
| Artwork | `status === AVAILABLE`, `isAvailable` | ❌ None |
| Product variant | `stock >= quantity` | ❌ None |
| Ticket type | `quantity - quantitySold >= qty` | ❌ None |
| Tickets issued | — | ❌ No `Ticket` rows created |

`pages/api/orders/checkout.ts` creates PENDING order only.

Legacy M-Pesa path saves `Transaction` as pending but has no callback to finalize.

---

## Scope

### In scope

- Shared fulfillment function called from Paystack webhook
- Prisma transaction (`$transaction`) for atomicity
- Artwork: `status = SOLD`, `isAvailable = false`
- Ticket: increment `quantitySold`, create `Ticket` rows with unique `code`
- Product: decrement `ProductVariant.stock`
- SendGrid order confirmation email
- Handle RESERVED artworks (buyer who holds reservation)

### Out of scope

- Refunds / chargebacks
- Partial fulfillment
- CRM order management UI
- Shipping label generation

---

## Implementation steps

### Step 1 — Fulfillment module

Create `lib/orders/fulfill.ts`:

```ts
export async function fulfillOrder(orderId: string): Promise<void>
```

Logic:

1. Load order with items + relations inside `prisma.$transaction`.
2. Guard: if `order.status === 'PAID'`, return early (idempotent).
3. For each `OrderItem`:
   - **ARTWORK:** `update artwork set status=SOLD, isAvailable=false`
   - **TICKET:** `update ticketType set quantitySold += qty`; create `qty` `Ticket` records with `randomUUID()` codes
   - **PRODUCT:** `update variant set stock -= qty` with check `stock >= qty`
4. Set `order.status = 'PAID'`.
5. Commit transaction.

On stock failure mid-transaction, roll back entire fulfillment.

### Step 2 — Wire webhook

In `pages/api/paystack/webhook.ts` (Plan 02):

```ts
if (event.event === 'charge.success') {
  await fulfillOrder(orderId);
  await sendOrderConfirmationEmail(orderId);
}
```

### Step 3 — Reserved artwork path

Checkout currently requires `status === AVAILABLE`. Extend to also allow:

```ts
status === 'RESERVED' && reservedByUserId === userId
```

On fulfillment, clear `reservedUntil` / `reservedByUserId`.

Align with `lib/reservations.ts` + `releaseExpiredReservations()` already called at checkout start.

### Step 4 — Ticket codes

Generate URL-safe codes: `nanoid(8)` or `crypto.randomBytes(4).toString('hex').toUpperCase()`.

Store on `Ticket.code` (unique). Include in confirmation email.

### Step 5 — Order confirmation email

Create `lib/email/order-confirmation.ts`:

- Use existing `@sendgrid/mail` pattern from `pages/api/contact/send-contact-email.ts`
- Template: order id, items, total, delivery method, ticket codes (if any)
- Env: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`

Send to `order.user.email`.

### Step 6 — Failed / expired orders

Optional cron or lazy cleanup:

- PENDING orders older than 30 minutes with no payment → `CANCELLED` (add enum if needed)
- Do not release inventory (never reserved at PENDING stage — current design is safe)

---

## Files to touch

| File | Change |
| ---- | ------ |
| `lib/orders/fulfill.ts` | **New** — core fulfillment |
| `lib/email/order-confirmation.ts` | **New** |
| `pages/api/paystack/webhook.ts` | Call fulfill + email |
| `pages/api/orders/checkout.ts` | Allow RESERVED-by-buyer artworks |
| `prisma/schema.prisma` | Add `CANCELLED` to `OrderStatus` if missing |

---

## Test plan

1. Pay for artwork → status SOLD, not purchasable again.
2. Pay for 2 tickets → `quantitySold += 2`, 2 `Ticket` rows, codes in email.
3. Pay for merch variant → stock decremented.
4. Replay webhook → no double decrement.
5. Concurrent checkout on last ticket → one succeeds, one 409 at checkout (before payment).
6. Reserved artwork: hold → checkout → pay → SOLD.

---

## Acceptance criteria

- [ ] PAID orders reflect inventory changes in DB
- [ ] Ticket codes generated and emailed
- [ ] Fulfillment is idempotent
- [ ] All updates in a single Prisma transaction
- [ ] Confirmation email sent on success

---

## Schema reference

```prisma
model Order { status OrderStatus; paystackRef String? }
model OrderItem { itemType; artworkId; ticketTypeId; productVariantId; quantity }
model Ticket { code String @unique; ticketTypeId; orderId; userId }
model TicketType { quantity; quantitySold; salesStart; salesEnd }
model Artwork { status ArtworkStatus; isAvailable; reservedByUserId; reservedUntil }
model ProductVariant { stock }
```
