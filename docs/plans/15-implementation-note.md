# Plan 15 — Implementation Note

Written before coding, per the plan's required implementation sequence. It lists
the existing behavior we must preserve, the exact files/routes to change, and
the migration strategy for the shared Postgres database.

## Current state (verified)

- Both repos share one Postgres DB. The **app repo owns the shared migration
  history**; the CRM repo carries only its own migrations plus duplicated shared
  ones. `deploy/deploy.sh` runs `migrate-app` then `migrate-crm` sequentially.
- Schemas are *mostly* mirrored but already diverge: app has `StudioPageContent`
  and `Membership.isFounding`; CRM has `CrmUser`/`CrmSession`/`CrmRole`/
  `CrmPermission` + join tables. Currency defaults differ (CRM `KES`, app `USD`).
- `Order.userId` and `Ticket.userId` are required → guest checkout is impossible.
- `Order.paymentProvider` is required → complimentary (zero-value) issuance is
  impossible.
- Ticket stock is checked read-then-increment in `checkout.ts` and incremented at
  fulfillment in `lib/orders/fulfill.ts`; oversell protection exists only at
  fulfillment time (after payment). No reservation/expiry for tickets.
- `Ticket` has `checkedInAt` only; no check-in page, staff attribution, reversal,
  or audit. No `Refund` model anywhere; no Paystack refund API calls.
- CRM permissions seeded in `prisma/seed.ts` (artworks/series/events/tickets/
  orders/merch/announcements/staff/music). No check-in/report/complimentary/
  refund keys.
- CRM has **no server-side model provider configured** (.env has no OpenAI/
  Anthropic/etc. key). Per plan A2, OpenUI must be integrated using an
  allowlisted deterministic action registry; the provider/secret is recorded as
  a deployment prerequisite (see below), not invented.
- Existing CRM UI is Tailwind with a serif display font (`font-display`) and
  neutral palette. Roboto is not loaded yet.

## Migration strategy

1. **App repo** — one shared forward-only migration
   `20261010000000_event_ticketing_end_to_end/migration.sql`:
   guest order/ticket columns, `Order.source`/`paymentStatus`/nullable provider,
   `TicketType.quantityReserved`/`archivedAt`, `Event.ticketMode`,
   `ticket_reservations`, plus `refunds`, `refund_events`, `ticket_check_ins`,
   `crm_audit_logs` and their indexes. No FK to `crm_users` here because on a
   fresh DB `migrate-app` runs before `crm_users` exists.
2. **CRM repo** — one forward-only migration
   `20261010000001_event_ticketing_crm_links/migration.sql`: add the FK
   constraints from the new columns/tables to `crm_users` (guarded/`IF EXISTS`).
   Runs after app + `crm_staff_auth`, so `crm_users` exists.
3. Mirror the model/relation changes in both `prisma/schema.prisma`; CRM-only
   models (`Refund`, `RefundEvent`, `TicketCheckIn`, `CrmAuditLog`) and the
   `CrmUser` back-relations live only in the CRM schema.

## Files/routes to change

### App schema + shared domain
- `prisma/schema.prisma` (+ migration above)
- `lib/orders/complete-payment.ts`, `lib/orders/fulfill.ts` — set
  `paymentStatus`, support guest/nullable `userId`, use reservations for tickets.
- `lib/ticketing/inventory.ts` (new) — atomic reserve/release/finalize.
- `lib/ticketing/guest.ts` (new) — guest order + one ticket per admission +
  retrieval token.
- `lib/paystack.ts` — add `initializeRefund`, `verifyRefund`, refund status map.
- `pages/api/orders/checkout.ts` — guest path, ticket reservations, no forced
  account; keep merch/artwork/music behavior unchanged.
- `pages/api/paystack/{verify,webhook}.ts` — idempotent completion + refund
  reconciliation events.
- `pages/api/orders/tickets.ts` / `pages/api/events/[slug].ts` — public ticket
  availability (no guest PII).
- `pages/api/events/tickets/retrieve.ts` (new) — email-verified retrieval.
- `lib/email/ticket-confirmation.ts` (new) — QR ticket delivery + resend state.

### App customer UI
- `pages/events/index.tsx`, `pages/events/[slug].tsx` — published-only, ticket
  cards, sales window/remaining state (informational).
- `pages/shop/checkout.tsx` (or `components/shop/checkout.tsx`) — guest fields,
  attendee rows, review step.
- `pages/tickets/retrieve.tsx` (new) — guest retrieval by reference + email.

### CRM schema + domain
- `prisma/schema.prisma` (+ CRM migration above), `prisma/seed.ts` (permissions).
- `lib/audit.ts` (new) — append-only audit writes.
- `lib/ticketing/complimentary.ts` (new) — transactional issuance.
- `lib/refunds.ts` (new) — request/approve/submit/reconcile, self-approval guard.
- `pages/api/events/[id]/complimentary.ts` (new)
- `pages/api/events/[id]/report.ts` (new, replaces/extend `sales.ts`)
- `pages/api/tickets/[code]/check-in.ts` (new) + `reversal.ts`
- `pages/api/refunds/index.ts`, `pages/api/refunds/[id]/approve.ts` (new)
- `pages/api/orders/index.ts`, `pages/api/events/[id].ts`,
  `pages/api/events/[id]/ticket-types*.ts` — capacity guard vs
  `quantitySold + quantityReserved`, archive not delete.

### CRM UI (shared first, then workflows)
- `styles/globals.css` + `pages/_document.tsx` — load Roboto w/ system fallback.
- `components/ui/*` (new) — shared Button, Field, Select, Date/time, Currency,
  Table, StatusBadge, Alert, Dialog, WizardStep, EmptyState.
- `components/openui/*` (new) — allowlisted component/action registry + assistant.
- `pages/dashboard/events.tsx` — event wizard (3 steps) + events table.
- `pages/dashboard/tickets.tsx` — ticket types, attendees, check-in link.
- `pages/dashboard/checkin.tsx` (new) — QR scan + manual code + result.
- `pages/dashboard/refunds.tsx` (new) — request/approve queue.
- `pages/dashboard/orders.tsx`, `dashboard/index.tsx` — ops/report tables + CSV.

## OpenUI deployment prerequisite

No model provider credentials exist in this repo. The deterministic workflow
components and the typed, permission-checked action registry are implemented:

- CRM `components/openui/library.ts` — allowlisted actions mapping to existing
  CRM routes/APIs with required permissions; write actions resolve to reviewed
  workflow pages and never execute from model output.
- CRM `components/openui/Assistant.tsx` — assistant panel; with no provider it
  runs deterministic intent routing.
- CRM `pages/api/openui/action.ts` — server-side allowlist + permission guard;
  read actions execute against CRM data, write actions return a workflow route.
- CLI verified (`@openuidev/cli`): `generate` turns a `createLibrary()` spec into
  the system prompt + serialized spec for a self-hosted OpenAI-compatible
  runtime.

To enable the natural-language model runtime, set the server-only env vars
`OPENUI_MODEL_BASE_URL`, `OPENUI_MODEL_API_KEY`, `OPENUI_MODEL_NAME` (see CRM
`.env.example`). Never commit keys or send them to the browser. Until then the
deterministic wizard/workflow is the source of truth.

## Status

Implemented and typechecked in both repos; the two migrations were applied to
the local dev database. Remaining for production: run `migrate-app` then
`migrate-crm` on deploy (already the deploy order), set `PAYSTACK_SECRET_KEY` on
the CRM server for refunds, and set the OpenUI provider vars to enable the
model-backed assistant.
