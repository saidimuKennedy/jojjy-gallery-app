# Plan 15 — Event & Ticketing End to End

**Status:** Ready for implementation
**Repos:** `jojjy-gallery-crm` + `jojjy-gallery-app`
**Owner:** Implementing agent
**Supersedes:** [Plan 06 — Ticket Sales Window & Checkout Enforcement](./06-ticket-sales-window.md)

## Goal

Deliver one complete event and ticket lifecycle across the staff CRM and the public gallery app:

1. Staff create and publish an event through a short, guided wizard.
2. Staff define ticket types and a hard ticket limit for the event.
3. Customers buy tickets as guests, without creating accounts.
4. Staff issue complimentary tickets through the same inventory and transaction ledger as paid tickets.
5. Staff scan QR tickets at the door and see accurate event reporting.
6. Refunds are initiated through Paystack where supported, with independent approval and an immutable audit trail.

The CRM must use **OpenUI** for its assistant interface and guided workflows. OpenUI helps staff express intent and renders supported workflow UI, while the source of truth remains the existing CRM APIs and database. Every write action must be permission-checked, validated, and reviewable before commit. The assistant must never execute arbitrary SQL or bypass a workflow confirmation.

## Product decisions (fixed; do not reopen during implementation)

- A customer can buy tickets without a gallery account.
- Each ticket type belongs to exactly one event. An event can have zero or many ticket types.
- Paid and complimentary tickets consume the same event/ticket-type inventory. The system must never issue or sell above the configured limit.
- Complimentary tickets are real ticket records, have unique QR codes, and create an auditable zero-value order/issuance record.
- Door entry uses QR scanning. Manual code lookup is the accessible fallback.
- Refunds are submitted to Paystack through its refund flow when the original transaction is eligible. The CRM must display the provider status and must not mark a refund complete on request alone.
- A staff member cannot approve their own refund request. Refund requests require a different authorized approver before the CRM submits them to Paystack.
- The CRM uses **Roboto** for all typography, consistently across every CRM page. Use one shared CRM component system; do not make event-specific button, field, table, modal, badge, or wizard styles.
- Integrate OpenUI into the existing CRM application; do not replace it with the standalone Next.js project produced by the CLI.
- OpenUI may help interpret staff intent and render supported workflow components, but its output uses an allowlisted component/action registry. All persistent operations call existing authenticated CRM APIs.
- Publishing/cancelling events, issuing complimentary tickets, approving refunds, and correcting check-ins always require a deterministic review/confirmation step. OpenUI cannot approve the same user's refund request.
- The public gallery app must reuse its existing visual language and shared components. Do not copy CRM styling into the customer app.
- Report and operational records are presented primarily in searchable, filterable tables. Create, configure, and issue actions are presented as short, sequential cards. Do not put the full creation process in a large modal.
- All timestamps are stored as UTC and displayed in the user’s configured/local timezone with an explicit timezone label where ambiguity is possible.

## Existing implementation to preserve and extend

The two repositories have mirrored Prisma schemas and share one Postgres database. Relevant existing models include `Event`, `TicketType`, `Ticket`, `Order`, `OrderItem`, and `CrmUser`/permission models. The CRM already has event and ticket pages/APIs; the gallery already has event pages and a checkout route. Start by reading both implementations and preserve working behaviors that do not conflict with the fixed decisions above.

Known mismatch to resolve: current ticketing/order records require a logged-in `User`, which conflicts with guest checkout. Current ticket creation/stock accounting also does not provide a complete auditable complimentary/refund lifecycle. The implementing agent must add the schema and migration work below in both mirrored schemas.

## Schema and invariants

Before UI work, inspect actual current schemas and migrations in both repos. Make the same shared-model changes in both `prisma/schema.prisma` files and add one reviewed, forward-only migration in the app repo. Do not hand-edit production data or apply a production migration as part of this plan.

### Required model changes

1. **Guest buyer identity**
   - Make `Order.userId` nullable; retain it for signed-in buyers.
   - Add order-level guest contact snapshots: `guestName`, `guestEmail`, and `guestPhone` (email required for guest ticket checkout; phone optional unless the payment method requires it).
   - Make `Ticket.userId` nullable and add ticket-holder snapshot fields `holderName` and `holderEmail`; ticket-holder fields default from buyer contact but can be individually entered in checkout.
   - Guest checkout must not silently create a `User` account.

2. **Recorded issuance source and payment state**
   - Add an explicit order source with at least `ONLINE` and `CRM_COMPLIMENTARY` values.
   - Allow a null payment provider for zero-value complimentary issuance. Paid orders use Paystack.
   - Represent payment state separately from order lifecycle, with a `NOT_REQUIRED` state for complimentary orders and explicit pending/success/failure/refund states for paid orders. Preserve existing order status compatibility for other products; do not reinterpret merch/music/artwork order statuses globally.
   - Store `issuedByCrmUserId` and a required reason on complimentary issuance. Reference the CRM staff identity, not the customer `User` table.

3. **Refund records and approval**
   - Add a refund record linked to the paid order and, where applicable, its ticket(s). Store amount, currency, reason, requester CRM user, approver CRM user, approval/submission/settlement timestamps, Paystack reference/id, and provider status.
   - Require `requesterCrmUserId != approverCrmUserId` in service logic and database-safe validation where practical.
   - Store provider status changes as an append-only refund event/history or equivalent immutable audit rows. Never delete or overwrite the evidence needed to explain a refund.
   - A refund request remains `REQUESTED` until a different authorized staff member approves it; only then submit it to Paystack. Provider response/webhook transitions it through `SUBMITTED`/`PROCESSING` to `PROCESSED`, `FAILED`, or `NEEDS_ATTENTION`.

4. **Inventory and ticket state**
   - Treat issued complimentary tickets as consuming inventory exactly like paid tickets.
   - Replace unsafe read-then-increment stock logic with a transaction/atomic reservation strategy so simultaneous checkouts cannot exceed the cap.
   - If checkout reserves stock before payment, define and implement a reservation expiry and release rule. Expired/failed payment reservations return to availability; paid/complimentary issuance remains allocated. Keep the rule consistent in CRM and app.
   - Do not allow capacity or ticket-type quantity to be lowered below already issued plus active reservations.
   - Refunding/cancelling a ticket voids its QR code. It returns to the available pool only after provider refund is confirmed (or immediately for a complimentary ticket once explicitly cancelled); never recycle the old ticket code.
   - If event capacity is stored only as the sum of ticket-type quantities, label it as the sum in UI. Do not introduce a second independent capacity number without a clear invariant.

5. **Check-in audit**
   - Record check-in timestamp and staff identity. Prevent duplicate scans atomically.
   - Provide an auditable reversal/correction action. A corrected check-in must retain the original scan and record who corrected it and why.

### Data relationships

```text
Event 1 ── many TicketType
TicketType 1 ── many OrderItem
Order 1 ── many OrderItem
Order 1 ── many Ticket
TicketType 1 ── many Ticket
Order 0..1 ── many Refund
CrmUser 1 ── many complimentary issuances / refund requests / approvals / check-ins
```

An issued `Ticket` is one attendee admission. An `OrderItem` can represent a quantity; ticket issuance creates one ticket row per admission. The order and item preserve what was bought at the time, even if ticket type name or price changes later.

## Work package A — CRM shared UI foundation

**Repo:** `jojjy-gallery-crm`

1. In a scratch directory outside the CRM repo, run the requested OpenUI scaffold command to inspect its supported setup and generated files:

   ```bash
   npx @openuidev/cli@latest create
   ```

   The official CLI `create` command scaffolds a new Next.js app. Do not run it at the CRM repo root or overwrite the existing CRM. Use the generated app as an integration reference, then integrate the needed OpenUI SDK/runtime into the existing Pages Router CRM while preserving its auth, routes, Prisma client, and deployment setup. Reference: [OpenUI CLI](https://www.openui.com/docs/api-reference/cli).

2. Use a provider-agnostic server-side Chat Completions client configured by `OPENUI_MODEL_BASE_URL`, `OPENUI_MODEL_API_KEY`, and `OPENUI_MODEL_NAME`. The selected provider is **DeepInfra**, serving **DeepSeek V4.1 Flash**: base URL `https://api.deepinfra.com/v1/openai`, model ID `deepseek-ai/DeepSeek-V4.1-Flash`, and the user will add their DeepInfra API key later. The client appends `/chat/completions`, so the configured base URL must not include that path. Keep the key server-side. Reference: [DeepInfra DeepSeek V4.1 Flash integration](https://deepinfra.com/blog/deepseek-v4-1-flash-model-overview-integration). Also support other providers that implement the same Chat Completions/tool-calling interface by changing configuration, without changing CRM workflow code. When the hosted API key is absent, use deterministic routing rather than making an unauthenticated request.
3. Change global CRM typography to Roboto, including OpenUI-rendered surfaces, headings, forms, tables, dialogs, and navigation. Load the font using the project’s supported font-loading approach; retain a system fallback.
4. Define one shared, typed OpenUI component/action registry for the whole CRM. Reuse shared page headers, buttons, text fields, selects, date/time inputs, currency input, tables, status badges, alerts, empty/loading/error states, confirmation dialogs, and wizard steps. Event/ticket UI must compose these shared components; no one-off event styles.
5. Connect the FAB to the authenticated `/api/openui/chat` endpoint so configured providers are actually used. Retain deterministic intent routing as the no-key/error fallback. Define an allowlist of OpenUI actions that map to existing CRM APIs. Validate every action payload on the server and enforce existing CRM session/permission checks. Never expose Prisma/database tools directly to the model.
6. Ensure keyboard navigation, visible focus, semantic labels, and responsive layouts. QR scanning must have a manual code-entry fallback.

**Done when:** OpenUI is integrated into the existing CRM without replacing its app structure; CRM pages consistently use Roboto and shared components; supported intent maps to typed, permission-checked actions; wizard/table patterns can be reused by other CRM modules without copying event-specific styles.

## Work package B — CRM guided event and ticket workflows

**Repo:** `jojjy-gallery-crm`

### Event creation flow

Build an in-page, sequential flow reachable from the Events list. Use compact cards with one clear purpose per step, a visible progress indicator, and Back/Continue actions. Do not use an oversized modal for the whole process. Each card should be usable on a laptop and narrow screen without scrolling through unrelated fields.

1. **Step 1 — Event basics card:** event title, unique slug generated from the title but editable, and short description. Show inline validation and a concise preview of the event title/slug. Save a draft and continue.
2. **Step 2 — When and where card:** start/end date and time, venue, directions, opening hours, and optional artist-talk time. Keep optional fields collapsed or in a clearly labeled optional subsection.
3. **Step 3 — Event image card:** choose/upload the cover image and preview the crop/display. Allow continuing without an image only if the existing public event page supports a safe placeholder; otherwise mark image required with explicit guidance.
4. **Step 4 — Ticket cards:** add each ticket type as its own compact card with name, description, price/currency, quantity, and sales start/end. Provide an “Add ticket type” action that creates another card. Show allocated, issued, reserved, and remaining quantities. Support free ticket types. Do not permit total ticket allocations or issuance to exceed limits.
5. **Step 5 — Review and publish card:** show a customer-facing event preview and a concise summary of ticket prices, limits, and sales windows. Offer Save draft, Publish now, and Schedule publication as separate explicit actions with validation and confirmation.

Use the same compact-card pattern for later edit flows; do not replace it with a giant edit modal. Persist progress after each step and use the existing draft/resume pattern so staff can leave and continue later. Publishing is blocked until required details and ticket configuration are valid. If an event is intentionally RSVP-only/no-ticket, require staff to select that mode explicitly.

The OpenUI assistant may help staff begin or navigate this flow, but the primary interface is the visible card sequence. Do not make a chat panel or floating button the only way to create an event.

### Event and ticket tables

- Events table: title, date/time, venue, state, ticket allocation, issued count, checked-in count, gross paid sales; actions View/manage, Edit, Publish/Cancel/Complete as permitted.
- Ticket types table scoped to an event: name, price, sales window, allocated, paid, complimentary, reserved, remaining, state; actions Edit and Archive. Never hard-delete a tier once it has orders or tickets.
- Include search, filters, sorting, pagination, and clear empty/loading/error states.
- Show explicit confirmation and consequences for canceling an event or changing a sold ticket type.

### Complimentary issuance wizard

1. Select event and ticket type.
2. Enter quantity, attendee names/emails (one attendee per ticket), and a required reason.
3. Review total quantity, remaining allocation, and zero charge; confirm issue.

On confirmation, create one zero-value order/issuance record, one order item, and one ticket row per attendee in a single transaction. Record the staff actor. Display/download/send each QR ticket through the same delivery mechanism as paid tickets. Do not expose a generic “adjust quantity” escape hatch.

### CRM operations/report tables

- **Orders:** order reference, buyer, email/phone, event, created time, paid amount, payment state, ticket count, refund state.
- **Attendees/tickets:** attendee, ticket code, event, ticket type, source (paid/complimentary), state, checked-in time, check-in staff.
- **Refunds:** request date, order, amount, reason, requester, approver, Paystack/provider state; separate Approve and Submit behavior with self-approval disabled.
- **Event report:** allocated, sold, complimentary, reserved, remaining, checked-in, gross paid sales, refunded amount, net sales. Define every total in UI. Complimentary issuance is count, never revenue.
- Export attendee/report CSV only if permission allows; exclude secret payment credentials and never include full QR secrets where unnecessary.

## Work package C — public customer event and checkout journey

**Repo:** `jojjy-gallery-app`

1. Keep the existing gallery visual system and shared app UI components. Do not use CRM styles, fonts, or navigation in the public app.
2. Event list/detail pages show only published, non-cancelled events; make schedule and venue clear.
3. Ticket cards show ticket name, description, price/currency, sales status, remaining/sold-out state, and quantity selector. Enforce sales windows and inventory in the server API; client display is informational only.
4. Checkout accepts guest name, email, phone when needed, attendee names/emails, and required consent/terms if already defined for commerce. Do not require login or create a customer account.
5. Show line items, per-ticket prices, fees if any, total, and event details before leaving for Paystack.
6. On success, verify payment server-side, finalize reservations transactionally, create one ticket per admission, and send confirmation with event details, order reference, and QR ticket(s). Never issue tickets from a browser redirect alone.
7. On failed/cancelled/expired checkout, show a clear recovery path and release inventory according to the reservation rule.
8. Provide a guest ticket retrieval path using an order reference plus email verification/one-time secure link. Do not expose tickets by sequential database IDs or unverified email-only lookup.

## Work package D — QR entry and refunds

**CRM:** implement a permission-gated check-in page with camera QR scan, manual code entry, event selection, scan result, and attendee details limited to operational needs. A scan for another event, invalid ticket, refunded/cancelled ticket, or duplicate scan must clearly fail. Successful check-in is atomic and attributed to the staff session.

**Refund flow:**

1. Authorized staff opens an eligible paid order/ticket and submits amount/scope plus required reason.
2. A different authorized staff member reviews the buyer, original charge, amount, and reason; self-approval is impossible in API logic, not only hidden in the UI.
3. Approval causes server-side Paystack refund initiation. Use the original verified transaction reference, never a client-supplied arbitrary reference.
4. Store the Paystack refund identifier/status and reconcile through webhook/status polling. The CRM distinguishes requested, approved, processing, processed, failed, and needs-attention.
5. Mark ticket invalid for entry only when refund/cancellation policy says it should be invalidated. For this release, invalidate upon confirmed refund; the approved-but-processing period remains valid and visible as refund pending.
6. Never allow the requester to approve their own refund. Never delete requests, approvals, provider responses, or audit history.
7. If a transaction is ineligible for Paystack refunds, show the exact provider error/status and leave the order/ticket unchanged. Do not silently substitute a manual cash refund.

Paystack documents full and partial refunds through its Refund API and refund status lifecycle; implementation must verify supported behavior for the actual account/currency/payment rail and handle provider rejection or `needs-attention`. Source: [Paystack Refunds](https://paystack.com/docs/payments/refunds/).

## Work package E — permissions and audit

Use existing CRM permission checks and add/confirm explicit keys for event management, ticket management, complimentary issue, check-in, reporting/export, and refund request/approve. Do not rely on hiding controls in the UI. Check authorization in every API route/service. Admin seed role receives all capabilities; least-privilege roles receive only explicit grants.

All high-impact actions record actor, action, target, timestamp, before/after values where relevant, and reason for complimentary issues, refund decisions, event cancellation, manual check-in correction, and ticket invalidation. Audit records are append-only to normal staff operations.

## Concurrency, privacy, and failure behavior

- Inventory reservation and finalization must be safe under concurrent checkout and complimentary issuance.
- Idempotency: repeated Paystack callbacks, repeated refund callbacks, and duplicate QR scans must not issue duplicate tickets, duplicate refunds, or duplicate check-ins.
- Never place Paystack secret keys in browser code, logs, or CRM payloads.
- Guest PII is visible only to staff with order/attendee access. Do not leak guest details in public APIs or event pages.
- Email delivery failure must not roll back a paid ticket issuance; store delivery state and allow authorized resend.
- Failed external API calls must leave a recoverable, inspectable state and must not create a false “paid”, “refunded”, or “checked in” result.

## Required implementation sequence

1. Inspect current app + CRM routes, schema, permissions, checkout and payment completion. Write a short implementation note listing exact files/routes to modify before coding.
2. Agree and implement the shared Prisma schema changes and migration; mirror schema into CRM.
3. Implement atomic inventory, guest order/payment behavior, ticket issuance, and refund lifecycle in server-side domain/API code.
4. Implement CRM shared components/Roboto and workflows: event wizard, ticket tables, complimentary issue, operations/report tables, refund approval, check-in.
5. Implement customer event browsing, guest checkout, secure retrieval, and email QR delivery using the existing gallery UI.
6. Reconcile permissions, webhook idempotency, failure states, and docs. Keep unrelated commerce behavior unchanged.

## Acceptance criteria

- [ ] A staff member can use the OpenUI CRM assistant to start the event wizard, then create an event, add multiple ticket types, save a draft, preview, publish/schedule, edit, and cancel through the guided CRM flow.
- [ ] With DeepInfra configured using base URL `https://api.deepinfra.com/v1/openai`, model `deepseek-ai/DeepSeek-V4.1-Flash`, and a server-side API key, the FAB calls `.../chat/completions` and maps only permitted tool calls to CRM actions; with the key absent it falls back to deterministic routing.
- [ ] CRM typography is Roboto throughout; event/ticket UI uses shared CRM components.
- [ ] Customer pages use existing gallery design conventions and allow complete guest purchase without account creation.
- [ ] Successful verified payment issues exactly one unique QR ticket per purchased admission and sends a retrievable confirmation.
- [ ] Complimentary tickets require a reason, are attributable to a CRM user, consume the same inventory, and appear in order/attendee/report tables as zero-value issuance.
- [ ] Concurrent paid/complimentary issuance cannot exceed event/ticket-type allocation; failed/expired reservations release according to the defined expiry rule.
- [ ] Staff can scan or manually enter a code; valid check-in is recorded once with actor/time; invalid/duplicate/refunded tickets are rejected clearly.
- [ ] Refund approval by requester is blocked server-side; a different authorized staff member can approve; eligible refunds are submitted to Paystack and statuses are reconciled without false completion.
- [ ] Event, ticket, order, attendee, refund, and sales reports are searchable/filterable tables with definitions for their totals.
- [ ] Permission checks cover APIs and pages/actions; every sensitive issue/refund/check-in correction action has an audit record.
- [ ] Existing artwork, merch, and music checkout behavior remains compatible with shared `Order` changes.

## Explicitly out of scope

- Assigning seats or interactive venue maps.
- Ticket resale/transfers, waitlists, promo codes, dynamic pricing, recurring events, or multi-currency event pricing beyond the existing payment model.
- Allowing OpenUI/model output to execute financial or ticket actions without typed allowlisted APIs, permission checks, and review/confirmation steps.
- Manual cash refunds outside Paystack.
- Forcing account creation or silently creating accounts for guests.
