# Plan 07 — Apply Production Database Migrations

**Status:** Not started  
**Repo:** Both (shared schema)  
**Effort:** S (half day, mostly verification)  
**Blocks launch:** Yes  
**Requires:** Explicit user approval before touching live DB

---

## Goal

Safely apply pending Prisma migrations to the **live managed Postgres** (`db.prisma.io`) without data loss — enabling events, tickets, merch, orders, artwork status, Phase 2 fields, and music module tables.

---

## Current state

Per `docs/handoff-2026-07-12.md`:

- `DATABASE_URL` / `DIRECT_URL` point at live DB with real seeded data
- **Never run `prisma migrate dev`** against live — can auto-reset
- Several migrations written and verified locally but **not applied** to production
- Safe command: `prisma migrate deploy` (applies only, never resets)

### Pending migrations (verify list before run)

| Migration | Adds |
| --------- | ---- |
| `20260712000000_add_events_tickets_merch_orders` | Event, TicketType, Ticket, Product, Order, Announcement, Subscriber |
| `20260712010000_add_artwork_status` | `Artwork.status` enum |
| `20260712020000_phase2_fan_collections_events_delivery` | Wishlist, RSVP, SeriesMedia, EventMedia, delivery fields |
| `20260712130000_order_item_artwork` | Artwork line items on Order |
| `20260715160000_add_music_module` | Music tables (defer feature, schema can exist) |

Run `ls prisma/migrations/` for authoritative list at execution time.

---

## Pre-flight checklist

- [ ] User explicitly approves production migration window
- [ ] Backup confirmed (Prisma Console snapshot or provider backup)
- [ ] All migration SQL hand-reviewed — no destructive drops
- [ ] `npx prisma validate` passes
- [ ] Local throwaway Postgres replay succeeded (handoff recipe)
- [ ] `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` exits 0
- [ ] Gallery + CRM builds pass against generated client
- [ ] No code deployed that **requires** new columns before migration runs (coordinate deploy order)

---

## Implementation steps

### Step 1 — Local verification (throwaway DB)

From handoff doc:

1. Spin up local Postgres on free port.
2. Point `DIRECT_URL` at throwaway DB.
3. `npx prisma migrate deploy` — replays full history.
4. `prisma migrate diff` — must show no drift.
5. Tear down cluster.

### Step 2 — Staging dry run (if available)

If a staging DATABASE_URL exists, run deploy there first.

### Step 3 — Production deploy

```bash
# Ensure DIRECT_URL points at production (prisma.config.js uses DIRECT_URL)
npx prisma migrate deploy
npx prisma generate
```

**Do not** run `migrate dev`, `db push`, or `migrate reset`.

### Step 4 — Post-deploy verification

1. `prisma migrate status` — all applied
2. Smoke queries: `SELECT COUNT(*) FROM artworks`, events table exists
3. Hit gallery homepage, one artwork, one event API
4. CRM login + artwork list

### Step 5 — Rollback plan

Prisma migrate deploy is **forward-only**. Rollback = restore from backup or hand-write reverse SQL. Document backup timestamp before step 3.

---

## Deploy order

```
1. migrate deploy (production DB)
2. deploy CRM (if schema-dependent features)
3. deploy Gallery (checkout, Paystack — Plans 02–03)
```

If app code ships before migrations, new queries will fail on missing tables.

---

## Files / tools

| Path | Purpose |
| ---- | ------- |
| `prisma/migrations/*/migration.sql` | Migration SQL |
| `prisma.config.js` | Uses `DIRECT_URL` for CLI |
| `docs/handoff-2026-07-12.md` | Safety rules |
| `scripts/audit-env.mjs` | Verify env before deploy |

---

## Test plan

Post-migration:

- [ ] Existing artworks still load
- [ ] User login/register works
- [ ] New tables queryable (empty OK): `orders`, `events`, `ticket_types`
- [ ] CRM dashboard loads without Prisma errors
- [ ] No 500s on `/api/artworks`, `/api/events`

---

## Acceptance criteria

- [ ] `prisma migrate status` shows all migrations applied on production
- [ ] No data loss on existing artworks/users/transactions
- [ ] LAUNCH_CHECKLIST migrations row → ✅
- [ ] Document completion date in LAUNCH_CHECKLIST

---

## Communication template

Before running, send user:

> Ready to apply N pending migrations to production. Backup at [time]. Migrations add events/tickets/orders/Phase2/music schema. Rollback = restore backup. Approve to proceed?
