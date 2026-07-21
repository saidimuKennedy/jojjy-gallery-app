# Plan 06 — Ticket Sales Window & Checkout Enforcement

**Status:** Not started  
**Repo:** `jojjy-gallery-crm` + `jojjy-gallery-app`  
**Effort:** M (1–2 days)  
**Blocks launch:** Yes  
**Depends on:** [Plan 02](./02-paystack-payment-end-to-end.md) for public ticket purchase (can do CRM UI first)

---

## Goal

1. CRM: edit ticket types (qty, price, **sales window**)
2. Gallery: enforce `salesStart` / `salesEnd` at checkout
3. Public event page: buy tickets (not just RSVP)

---

## Current state

| Layer | Status |
| ----- | ------ |
| Schema | `TicketType.salesStart`, `salesEnd`, `quantity`, `quantitySold` |
| CRM tickets UI | Create/delete types only — no edit, no date fields |
| CRM event create | `salesStart`/`salesEnd` on **event** in some API paths — not on ticket type UI |
| Checkout | Validates PUBLISHED event + remaining qty — **ignores sales window** |
| Event page | Shows tiers + RSVP — **no ticket checkout** |

---

## Scope

### In scope

- CRM: PUT `/api/events/[id]/ticket-types/[typeId]` — update name, price, qty, salesStart, salesEnd
- CRM tickets UI: datetime fields, edit form
- Gallery checkout: reject if `now < salesStart` or `now > salesEnd`
- Event detail: "Buy tickets" → checkout with `ticketTypeId` + Paystack (Plan 02)
- Display "Sales open / closed / opens DATE" on event page

### Out of scope

- Ticket check-in at door (separate feature)
- Waitlist when sold out
- Dynamic pricing

---

## Implementation steps

### Part A — CRM (ticket type CRUD)

#### Step 1 — Update API

Extend `pages/api/events/[id]/ticket-types.ts`:

- **PUT** (new): body `{ name, price, quantity, salesStart?, salesEnd? }`
- Permission: `tickets:write` (after Plan 05)
- Validate: `quantity >= quantitySold`, `salesEnd > salesStart` when both set

Add `pages/api/events/[id]/ticket-types/[typeId].ts` if cleaner routing.

#### Step 2 — CRM UI

Update `pages/dashboard/tickets.tsx`:

- Edit modal for existing types
- Date/time pickers for sales window (store ISO UTC)
- Show `quantitySold / quantity` read-only
- Optional: inherit event-level window as default when creating type

---

### Part B — Gallery (enforcement + purchase)

#### Step 3 — Checkout validation

In `pages/api/orders/checkout.ts`, ticket branch:

```ts
const now = new Date();
if (ticketType.salesStart && now < ticketType.salesStart) {
  return res.status(403).json({ message: "Ticket sales have not opened yet" });
}
if (ticketType.salesEnd && now > ticketType.salesEnd) {
  return res.status(403).json({ message: "Ticket sales have ended" });
}
```

#### Step 4 — Event page purchase UI

Update `pages/events/[slug].tsx`:

1. For each `ticketType`, compute status: upcoming / open / closed / sold out.
2. Quantity selector + "Buy ticket" button (requires login).
3. POST to `/api/orders/checkout` with `{ items: [{ ticketTypeId, quantity }] }`.
4. Redirect to Paystack (Plan 02 flow).
5. Keep RSVP as free alternative when event is RSVP-only (no paid types).

#### Step 5 — API exposes window to frontend

Ensure `pages/api/events/[slug].ts` returns `salesStart`, `salesEnd` on each ticket type (may already via Prisma include).

---

## Files to touch

| Repo | File | Change |
| ---- | ---- | ------ |
| CRM | `pages/api/events/[id]/ticket-types.ts` | PUT + validation |
| CRM | `pages/dashboard/tickets.tsx` | Edit UI + dates |
| Gallery | `pages/api/orders/checkout.ts` | Sales window checks |
| Gallery | `pages/events/[slug].tsx` | Buy flow + status labels |
| Gallery | `pages/api/events/[slug].ts` | Confirm fields exposed |

---

## Test plan

1. Create ticket type with window starting tomorrow → checkout returns 403 today.
2. Window in past → checkout returns 403 "ended".
3. Window open + stock → checkout creates order → Paystack → tickets issued (Plan 03).
4. CRM edit increases quantity → remaining updates.
5. CRM edit decreases quantity below sold → rejected.
6. Event page shows correct "Opens Mar 15" copy.

---

## Acceptance criteria

- [ ] CRM can set and edit sales window per ticket type
- [ ] Checkout rejects outside window
- [ ] Public event page supports paid ticket purchase
- [ ] RSVP still works for free events
- [ ] LAUNCH_CHECKLIST ticket operations → ✅

---

## UX copy (event page)

| State | Label |
| ----- | ----- |
| Before `salesStart` | "Tickets on sale from {date}" |
| Open | "Buy — {price}" |
| After `salesEnd` | "Ticket sales closed" |
| Sold out | "Sold out" |
