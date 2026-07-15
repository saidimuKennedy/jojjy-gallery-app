# Music Implementation Guide

> Version: 1.0  
> Status: Engineering playbook  
> Depends on:  
> - [product-music.md](./product-music.md)  
> - [music-schema.md](./music-schema.md)  
> - [music-decisions.md](./music-decisions.md)  
> - [music-payment.md](./music-payment.md)  
> - [music-entitlements.md](./music-entitlements.md)

---

# Purpose

How to implement Music against the **existing** Jojjy stack — without inventing parallel systems.

Repos: `jojjy-gallery-app` (public) · `jojjy-gallery-crm` (staff) · shared Postgres · mirrored Prisma schemas.

---

# Non-negotiables (from ADRs)

| Do | Don’t |
| --- | --- |
| Mirror every Prisma change in **both** repos | Migrate only one side |
| Fan = gallery `User`; staff = `CrmUser` | Put music admin on gallery `User.role` |
| Unlock = `ReleaseUnlock` (Order and/or CRM) | Add a `Purchase` payment table |
| Track audio = private + signed play | Put track MP3s on public Cloudinary |
| Covers = existing public image upload | Block covers on private audio store |
| MVP commerce = CRM manual grants | Block content shipping on Paystack |
| Anonymous tease = durable cookie (ADR-022) | Fingerprint for MVP |
| Pass stacking = max(now, expires) + days (ADR-023) | Overwrite expiry blindly |
| Play limit default 3 (ADR-024) | Per-release CRM UI in MVP |

---

# Recommended build order

Ship in **vertical slices**. Each slice should be demoable.

```text
Phase A  Schema + seed permissions
Phase B  CRM catalogue (Release/Track/cover/access) — Free publish
Phase C  Gallery browse + Free stream
Phase D  Paid tease (cookie quota) + members-only badge UX
Phase E  CRM MembershipPlan + manual grants + Library
Phase F  Order item types + checkout wiring (when shop Paystack is ready)
Phase G  Analytics polish
```

Do **not** start with Order automation or ABR streaming. Manual grants + Free + tease unlock product value first.

---

# Phase A — Schema & authz foundation

## Prisma (both repos)

Add models/enums from `music-schema.md`:

- `Release`, `Track`, `AccessPolicy` (+ optional `AccessStage` later)
- `MembershipPlan`, `Membership`
- `ReleaseUnlock`, `PaidPlayQuota`
- Extend `OrderItemType` with `RELEASE` | `MEMBERSHIP_PASS`
- Nullable FKs on `OrderItem`: `releaseId`, `membershipPlanId`

**IDs:** Int for catalogue; UUID for entitlements (match `Order` / `User`).

**Migration discipline:** hand-written SQL under `prisma/migrations/`, apply once to shared DB, mirror schema in CRM + gallery. Same process as CRM staff auth.

## CRM permissions seed

Add to permission catalog + Admin role (mirror `prisma/seed.ts` pattern):

```text
music:read
music:write
music:publish
music:archive
```

Wire `requirePermission` on every Music write/publish API. Nav can show Music to all staff initially; tighten UI gating when staff CRUD exists.

---

# Phase B — CRM catalogue (content only)

## Follow existing module pattern

Copy structure from Events / Merch / Media Blog:

| Piece | Pattern to clone |
| --- | --- |
| Dashboard page | `pages/dashboard/events.tsx` / merch |
| Layout nav | `components/DashboardLayout.tsx` |
| API | `pages/api/events/*`, `pages/api/products/*` |
| Upload | Existing CRM image upload for **covers** (`artworks:write`-style gate → use `music:write`) |

## Track audio upload (new)

- Separate endpoint from public cover upload.
- Store in **private** bucket/prefix (R2/S3/local). Persist `storageKey`, duration, bitrate, fileSize on `Track`.
- Never return permanent URL to the browser from CRM list APIs (optional signed admin preview URL with short TTL).

## Access defaults on create

```text
AccessPolicy.accessMode = PAID (or DRAFT-friendly FREE while drafting — product: mode required before publish)
paidPlayLimit = 3
currency = KES
```

Price required only when mode is PAID at publish time.

## Publish validation

Reuse Events’ draft→published mindset:

- title, slug, cover, ≥1 track, AccessPolicy present
- `music:publish` to leave Draft

---

# Phase C — Gallery Free path

## Public read APIs (gallery app)

- `GET /api/music/releases` — Published only; include access badge fields (`accessMode`, price, locked flag). Include MEMBERS_ONLY and PAID in the list (ADR-015).
- `GET /api/music/releases/[slug]` — detail + tracks metadata **without** raw `storageKey`.

## Playback API

Single endpoint, e.g. `POST /api/music/play`:

1. Resolve Release
2. Run entitlement resolver (shared `lib/music/entitlements.ts`)
3. On Allow → mint short-lived signed URL / cookie token for audio
4. On Paid tease Allow → increment `PaidPlayQuota` **after** auth succeeds (or atomically in same txn)
5. Return stream auth + remainingTeasePlays

**Free:** no session required.  
**Owned / member:** gallery NextAuth session.

## Player UI

- Persistent player component (site shell) — new, not Media Blog `<audio controls>` with public src.
- Badge components: Free / Purchase / Members only / Coming soon.

Keep Music **out of** `/gallery` Media Blog routes.

---

# Phase D — Paid tease + cookie

## Cookie (ADR-022)

| Name | `jg_music_aid` |
| --- | --- |
| Value | UUID v4 |
| Flags | `HttpOnly; Secure (prod); SameSite=Lax; Path=/; Max-Age≈1y` |
| Set | On first Music play response if missing |

## Quota row

`PaidPlayQuota`: prefer `userId` when logged in; else `anonymousKey` from cookie.

### Login merge

On successful gallery login (or first authenticated play):

```text
For each release where anonymousKey had playCount:
  userQuota.playCount = min(limit, userQuota.playCount + anon.playCount)
  delete or orphan anon rows for that browser key (optional cleanup job)
```

## UX

Show “X of 3 free plays left” on Paid release detail when not unlocked. At 0 → purchase / request-access CTA.

---

# Phase E — Membership plans + manual grants + Library

## CRM

- MembershipPlan CRUD (artist sets price + `durationDays`)
- Grant Unlock: pick User (email search) + Release → `ReleaseUnlock(source=CRM_MANUAL)`
- Grant Pass: pick User + Plan → Membership with stacking rule ADR-023
- Revoke Unlock / Cancel Membership (manual refund path)

## Gallery Library

`GET /api/music/library` (auth required):

```text
ReleaseUnlock joins
+ Releases where accessMode=MEMBERS_ONLY AND membership ACTIVE
```

## Members-only playback

Entitlement step: ACTIVE membership only when **current** mode is MEMBERS_ONLY. If mode is PAID → must have ReleaseUnlock (ADR-017).

---

# Phase F — Order automation (after shop Paystack works)

Extend `pages/api/orders/checkout.ts` XOR validation:

- Accept `releaseId` → `itemType: RELEASE`
- Accept `membershipPlanId` → `itemType: MEMBERSHIP_PASS`

On payment confirmation webhook (shared, not Music-specific):

```text
RELEASE → create ReleaseUnlock(source=ORDER, orderItemId=…)
MEMBERSHIP_PASS → create/extend Membership (ADR-023), link orderId
```

Gallery CTAs switch from “Request access” to real checkout when flag/env says fulfillment is live.

Until then keep Phase E grants as source of truth.

---

# Phase G — Analytics (light)

MVP counters:

- `Release.playCount++` on successful play start
- Count ReleaseUnlocks / Membership actives in CRM dashboard cards

PlaybackSession table = Phase 1.5.

---

# Shared libraries (suggested)

Put pure logic in gallery app first; CRM can duplicate thin grant helpers or later extract a tiny shared package if pain appears. Prefer **copy small entitlement helpers** over a premature monorepo package.

| Module | Responsibility |
| --- | --- |
| `lib/music/entitlements.ts` | Resolve access: Free / Unlock / Member / Tease / Deny |
| `lib/music/quota.ts` | Cookie ensure + PaidPlayQuota increment/merge |
| `lib/music/playback-token.ts` | Sign/verify short-lived stream auth |
| `lib/music/membership.ts` | Stacking expiry helper (ADR-023) |

CRM: `lib/music/grants.ts` for ReleaseUnlock + Membership writes under `requirePermission`.

---

# Entitlement resolver (pseudocode)

```text
function canPlay(release, userId?, anonymousKey?):
  if status not in (PUBLISHED, ARCHIVED): return Deny
  mode = currentAccessMode(release)  // stage-at-now or policy

  if mode == FREE: return Allow(unlimited)

  if userId and hasReleaseUnlock(userId, release.id): return Allow(owned)

  if mode == MEMBERS_ONLY:
    if userId and hasActiveMembership(userId): return Allow(member)
    return Deny(membership_required)

  if mode == PAID:
    if userId and hasReleaseUnlock(...): return Allow(owned)  // already covered
    q = getQuota(release.id, userId, anonymousKey)
    if q.playCount < release.accessPolicy.paidPlayLimit: return Allow(tease, remaining)
    return Deny(purchase_required)

  return Deny
```

Call **before** minting stream token. Increment tease quota only when returning Allow(tease).

---

# Storage split

| Asset | Where | How served |
| --- | --- | --- |
| Cover | Existing Cloudinary (CRM upload) | Public `imageUrl` / coverImage |
| Track audio | Private object store | Signed GET / gated proxy via playback API |

Local/dev: filesystem under a non-public path is fine if the playback API streams with Range support.

---

# Testing checklist (minimum)

- [ ] Free release plays logged-out
- [ ] Paid: 3 plays logged-out via cookie, 4th denied
- [ ] Login merges anon quota
- [ ] Members-only listed with badge; play denied without membership
- [ ] Grant membership → play members-only; change mode to Paid → play denied without unlock
- [ ] CRM grant unlock → Library + play
- [ ] Stacking pass extends expiry correctly
- [ ] Track URL not visible in network as permanent public CDN
- [ ] Schema present in both apps’ Prisma clients

---

# What to defer

- AccessStage timed ladder UI (mutate AccessPolicy manually at first)
- Per-release play-limit editor
- PlaybackSession analytics
- Recurring billing
- Multi-artist
- Order automation until webhook exists

---

# First PR suggestion (smallest shippable)

1. Dual-repo Prisma migration: Release + Track + AccessPolicy + music permissions seed  
2. CRM: create Draft release, upload cover (public), upload one track (private), publish Free  
3. Gallery: `/music` list + detail + play Free via signed stream  

That proves dual-schema, CRM module, and secure playback before tease/grants/orders.
