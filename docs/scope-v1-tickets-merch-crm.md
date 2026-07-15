# Scope: Ticketing, Merch, Fan Notifications & CRM (v1)

Status: scope confirmed with client. Ready for schema/architecture planning.
Date: 2026-07-12

## Background

Client wants to expand the gallery site beyond artwork sales to:
1. Sell tickets for their own events
2. Sell merch/branded items
3. Notify their fanbase about events

Admin functions move out of the public site into a dedicated CRM built for
jojjy-gallery-app, which manages this front-facing site's content (events,
tickets, merch, announcements, staff/permissions).

## Current state (for reference)

- Next.js Pages Router, Prisma + Postgres, custom session/User model
  (`UserRole.ADMIN` / `USER`)
- M-Pesa checkout already wired for artwork purchases
  (`pages/api/payment/checkout.ts`, `pages/api/mpesa`)
- Admin CRUD already exists for artworks/series/media-blog under
  `pages/api/admin/*` — this is the pattern being extended/pulled into the
  CRM
- SendGrid already a dependency (unused for bulk/announcement email today)

## Scope v1

### 1. Ticketing
- New domain, built in `jojjy-gallery-app`: Events, ticket types/tiers
  (price, quantity, sales window), ticket issuance tied to an order
- Checkout via Paystack

### 2. Merch
- New domain, built in `jojjy-gallery-app`, following the same pattern as
  the existing artwork e-commerce (not delegated to any external commerce
  platform): products, variants (size/color), inventory tracking
- Checkout via Paystack

### 3. Fan notifications
- Public on-site news/updates page (no external dependency)
- Email announcement blasts via SendGrid
- WhatsApp — sent via **Jiaminie**, used strictly as a messaging channel
  (see Decisions below)

### 4. CRM — dedicated app for jojjy-gallery-app
- New repo/app, shares the same Postgres DB (or a scoped subset) via Prisma
  with the public site
- Own deploy, own staff auth/session
- Owns admin/staff accounts and editable, per-user permissions (admin can
  grant/revoke individual capabilities, not just pick from fixed roles)
- All create/update/delete for events, tickets, merch, announcements lives
  here
- Public site (`jojjy-gallery-app`) becomes read/checkout-only for this
  content, same as it already is for artworks

### Sequencing
All three features (ticketing, merch, notifications) ship together as one
release. The CRM is built in parallel since it's the only way to manage the
new content types.

## Decisions (confirmed with client, 2026-07-12)

1. **Payment provider** — Paystack. Covers M-Pesa + card in a single
   integration for Kenya; no separate Stripe integration needed.

2. **E-commerce for merch and tickets** — built directly into
   `jojjy-gallery-app`, mirroring how artwork sales already work on the
   site. **Not** delegated to Jiaminie's commerce module, even though
   Jiaminie already has Product/Order/Customer models that could have
   covered this — client wants the gallery site to remain self-contained
   as an e-commerce platform.

3. **WhatsApp notifications — Jiaminie, scoped to messaging only.**
   Jiaminie (`/home/saidimu/Desktop/next/social`) already has a working
   WhatsApp webhook and messaging templates
   (`src/app/api/webhook/whatsapp/route.ts`,
   `src/app/actions/desk/whatsapp-templates.ts`). The CRM (or the gallery
   backend) will call Jiaminie purely to send WhatsApp messages to fans —
   Jiaminie is **not** used for orders, products, customers, or staff
   roles in this project.
   **Need from client: their WhatsApp Business phone number** to configure
   the WABA connection in Jiaminie.

4. **CRM roles/permissions — built in the new CRM app itself**, not
   borrowed from Jiaminie (since Jiaminie's role is now WhatsApp-only).
   Requirement: admin + staff, where an admin can create custom
   roles/privileges rather than being limited to fixed presets. Jiaminie's
   own permission model (`social/docs/architecture/permissions.md`) is a
   useful reference for the pattern — composable `module:action`
   permission strings per user, with roles as presets rather than the
   enforcement mechanism — but the actual implementation is new work in
   the CRM app, on its own User/Role/Permission tables.

5. **CRM network exposure** — internal only, auth-gated. No public
   domain/route required.

## CRM architecture (confirmed, 2026-07-12)

**Trigger (resolved 2026-07-12):** artwork/series/media-blog admin used to
render inline on public `pages/about.tsx` (client role check). That UI and
`pages/api/admin/*` are **retired** from the gallery; staff CRUD lives in
`jojjy-gallery-crm` with `CrmUser` + permission keys.

1. **Deployment** — separate Next.js app/repo, deployed on its own
   subdomain (e.g. `crm.jojjygallery.com`), independent of the public
   site's deploy.

2. **Database** — the CRM shares the same Postgres database as
   `jojjy-gallery-app` (so its writes are immediately visible on the public
   site), but each app keeps **its own copy of `prisma/schema.prisma`** and
   its own generated `PrismaClient`, both pointed at the same
   `DATABASE_URL`. No monorepo/shared-package restructuring — schema stays
   in sync by convention/discipline across the two repos (any migration
   that changes a shared table must be applied and mirrored in both
   schema files).

3. **Staff auth** — the CRM does **not** reuse the gallery's `User` table
   (that table is customer-facing, used for artwork/ticket/merch
   purchases). It gets its **own staff-only user table** (e.g. `CrmUser` /
   `CrmSession` / `CrmRole` / `CrmPermission`), scoped to the CRM's
   database connection, implementing the per-user editable permissions
   from the earlier decision (admin can grant/revoke individual
   capabilities, not just assign fixed roles). This keeps customer
   identity and staff identity cleanly separated.

4. **What lives in the CRM (done):** artwork/series/media-blog management,
   events/tickets, merch, announcements. Public site keeps read/checkout
   only. Gallery `pages/api/admin/*` and `components/Admin/*` removed.

## Next steps

1. ~~Design Prisma schema additions~~ **Done** — gallery schema + Phase-2
   fields (see `jojjy-gallery-app` migrations `202607120*`).
2. ~~Scaffold the CRM app/repo~~ **Done** — sibling repo
   `jojjy-gallery-crm` with Next.js Pages Router, shared-schema copy,
   `CrmUser`/`CrmSession`/`CrmRole`/`CrmPermission` staff auth, dashboard
   shell, and Staff permissions overview. Apply gallery migrations first,
   then CRM `20260712120000_add_crm_staff_auth`.
3. ~~Migrate admin UI/APIs into CRM; retire gallery admin~~ **Done** —
   CRM CRUD on `:3001`; `/about` admin panel and `pages/api/admin/*`
   removed from the public repo.
4. ~~CRM CRUD for events/tickets/merch/announcements~~ **Done** (thin
   dashboard screens + permission-gated APIs).
5. ~~Add public read/checkout routes~~ **Done (thin)** — events, shop,
   orders checkout stub (PENDING), wishlist/follow/account on the public
   site. **Still open:** Paystack payment completion on `Order`.
6. Build a thin integration from the CRM to Jiaminie's WhatsApp send API
   for fan notifications; configure the client's WhatsApp Business number
   in Jiaminie.
7. Build the on-site news/updates page and SendGrid announcement flow.
