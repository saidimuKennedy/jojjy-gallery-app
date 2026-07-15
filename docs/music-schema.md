# Music Schema Specification

> Version: 1.1  
> Status: Draft  
> Depends on:  
> - [product-music.md](./product-music.md)  
> - [music-domain.md](./music-domain.md)  
> - [music-payment.md](./music-payment.md)  
> - [music-decisions.md](./music-decisions.md)

---

# Purpose

Logical data model required to support Music.

This document avoids Prisma syntax but **must align** with the shared Postgres schema used by `jojjy-gallery-app` and `jojjy-gallery-crm` (mirrored `schema.prisma` in both repos).

It deliberately **reuses** existing commerce and identity entities instead of inventing parallel ones.

---

# Entity Overview

```text
Release
  ├── Track[]
  └── AccessPolicy (1:1 current)
        └── optional AccessStage[]  (time-boxed exclusivity ladder)

Gallery User  ── Order / OrderItem(RELEASE | MEMBERSHIP_PASS)
              ├── ReleaseUnlock (order-backed and/or CRM manual grant)
              ├── Membership (entitlement)
              ├── PaidPlayQuota (anonymous or user — 3 plays on Paid)
              └── Library (projection — not source of truth)

MembershipPlan ── Membership[]   (plans authored in CRM by artist)

CrmUser + music:* permissions  (staff publish + manual grants)
```

**Artist (MVP):** no separate `Artist` table. Use `artistName` (or site-level studio config) on `Release`. Multi-artist tables = Phase 2+.

**Purchase (domain):** not a payment-only table. Permanent unlock = `ReleaseUnlock` row created from paid `OrderItem` RELEASE **or** CRM manual grant.

---

# Conventions (match existing system)

| Concern | Convention |
| --- | --- |
| Catalogue IDs | Integer autoincrement (`Release`, `Track`, `MembershipPlan`, …) |
| Fan / order IDs | UUID strings (`User`, `Order`, `Membership`, …) |
| Money | Decimal(10, 2), currency default `KES` |
| Payment provider | Existing `PaymentProvider` enum (`MPESA`, `PAYSTACK`) |
| Soft end-of-life | Archive / status — no hard delete after sale |

---

# Release

Publishable musical work.

**Fields**

- id
- slug (unique)
- title
- description
- coverImage
- artistName (MVP studio display name)
- releaseType (SINGLE | EP | ALBUM | LIVE_SESSION | ACOUSTIC_SESSION)
- genre
- publishStatus (DRAFT | SCHEDULED | PUBLISHED | ARCHIVED)
- publishAt (nullable — when Scheduled goes live)
- explicit
- releaseDate (catalogue/release date metadata; may differ from publishAt)
- playCount (MVP analytics counter; optional)
- createdAt / updatedAt

**Relationships**

- has many Tracks
- has one current AccessPolicy
- may have many AccessStages (optional history/ladder)
- referenced by OrderItems (RELEASE) and Membership entitlements indirectly

---

# Track

Playable audio belonging to a Release.

**Fields**

- id
- releaseId
- title
- trackNumber
- duration (seconds)
- storageKey (or private object key — **not** a permanent public URL)
- bitrate
- fileSize
- createdAt / updatedAt

**Relationships**

- belongs to Release

Tracks cascade-delete only while the parent Release has never been purchased (enforced in application rules). After any paid unlock, Release delete is prohibited.

---

# AccessPolicy

Current unlock rules for a Release (1:1).

**Fields**

- id
- releaseId (unique)
- accessMode (FREE | PAID | MEMBERS_ONLY)
- price (nullable; required when PAID; **editable anytime** — ADR-021)
- currency (default KES)
- paidPlayLimit (default **3** for PAID tease — ADR-005)
- updatedAt

**Not an access mode:** SCHEDULED. Scheduling belongs on `Release.publishStatus` / `publishAt`.

Optional later: `previewSeconds` for clip UX — MVP paywall for Paid is play-count based.

---

# AccessStage (optional but recommended for exclusivity ladder)

Time-boxed access mode for a Release (supports Exclusive → Paid → Free).

**Fields**

- id
- releaseId
- accessMode (FREE | PAID | MEMBERS_ONLY)
- price (nullable)
- startsAt
- endsAt (nullable = open-ended)
- sortOrder

**Resolution:** at playback time, if stages exist, pick the stage where `now` ∈ [startsAt, endsAt); else fall back to AccessPolicy.

MVP may ship with **only AccessPolicy** and mutate `accessMode` manually; AccessStage can land when timed ladders are required. Product still describes stages either way.

---

# MembershipPlan

Catalogue of Studio Membership offers — **created and priced by the Artist in CRM** (ADR-016).

**Fields**

- id
- name
- description
- price
- currency (KES)
- durationDays (prepaid length — artist-set)
- active
- createdAt / updatedAt

`billingPeriod` / auto-renew fields are **Phase 2+**.

---

# Membership

Fan entitlement from a membership plan.

**Fields**

- id (uuid)
- userId → User
- membershipPlanId
- orderId (nullable — Order that paid for this pass, if any)
- grantedByCrmUserId (nullable — set for manual CRM grants)
- startedAt
- expiresAt
- status (ACTIVE | EXPIRED | CANCELLED)
- createdAt / updatedAt

---

# ReleaseUnlock

Permanent unlock of a Release for a User (Purchase projection source).

**Fields**

- id (uuid)
- userId → User
- releaseId
- orderItemId (nullable)
- grantedByCrmUserId (nullable)
- source (ORDER | CRM_MANUAL)
- createdAt

Unique (userId, releaseId).

---

# PaidPlayQuota

Tracks the Paid 3-play tease (ADR-005, ADR-022, ADR-024).

**Fields**

- id
- releaseId
- userId (nullable — set when logged in)
- anonymousKey (nullable — value of `jg_music_aid` cookie when anonymous)
- playCount (int, default 0)
- updatedAt

Unique (releaseId, userId) and unique (releaseId, anonymousKey) where non-null.

Global MVP limit: `AccessPolicy.paidPlayLimit` default **3** (no per-release CRM editor required).

On login: merge anonymous rows into user rows (sum counts, cap at limit) — see music-implementation.md.

When `playCount >= paidPlayLimit` and no ReleaseUnlock → deny further play; show purchase CTA.

---

# Commerce integration (existing entities)

Extend shared models — **do not** add `Purchase`:

| Extension | Purpose |
| --- | --- |
| `OrderItemType.RELEASE` | Permanent release unlock |
| `OrderItemType.MEMBERSHIP_PASS` | Prepaid Studio Membership |
| `OrderItem.releaseId` (nullable FK) | Set when itemType = RELEASE |
| `OrderItem.membershipPlanId` (nullable FK) | Set when itemType = MEMBERSHIP_PASS |

XOR rule (extend existing OrderItem pattern): exactly one of productVariantId / ticketTypeId / artworkId / releaseId / membershipPlanId matches itemType.

On payment success (shared fulfillment): mark Order PAID → create ReleaseUnlock / Membership → Library updates.

Until fulfillment is live: CRM creates ReleaseUnlock / Membership with `source = CRM_MANUAL` (ADR-019).

---

# Library

**No required LibraryItem table.**

Library is resolved as:

```text
ReleaseUnlock rows for this User
+
Published/Archived releases whose current access is MEMBERS_ONLY
  AND User has ACTIVE Membership covering now
```

Free releases stay in browse (not required in Library). Paid tease does not add Library items.

If a cache table is added later for performance, it must sync on membership expiry/cancel and manual revoke.

---

# PlaybackSession (Phase 1.5)

Optional analytics.

- id, userId, releaseId, trackId?, startedAt, endedAt, completed, device

MVP may rely on `Release.playCount` (+ payment reports) instead.

---

# Publish status

DRAFT | SCHEDULED | PUBLISHED | ARCHIVED

---

# Membership status

ACTIVE | EXPIRED | CANCELLED

---

# Access resolution (playback)

Evaluate server-side:

1. Release exists and is PUBLISHED or ARCHIVED (Draft/Scheduled → deny).
2. If ARCHIVED: allow only if ReleaseUnlock or (MEMBERS_ONLY + active membership).
3. Resolve **current access mode** (AccessStage at `now`, else AccessPolicy).
4. If FREE → **Allow** (anonymous OK — ADR-014).
5. If User has ReleaseUnlock for this Release → Allow.
6. If MEMBERS_ONLY and User has ACTIVE Membership with `now < expiresAt` → Allow.
7. If PAID and no unlock:
   - If PaidPlayQuota.playCount < paidPlayLimit (default 3) → Allow and increment quota on play start.
   - Else → Deny with purchase required.
8. If PAID and User is only a member (no unlock) → **Deny** (ADR-017 — must buy).
9. Else Deny.

Membership never writes a ReleaseUnlock.

---

# Data integrity rules

- ≥1 Track required before publish.
- Track cannot exist without Release.
- One current AccessPolicy per Release.
- Paid unlocks are Order-backed and/or CRM ReleaseUnlock grants; Membership never creates RELEASE ownership.
- Deleting a Release after any ReleaseUnlock is prohibited; Archive instead.
- Archived Releases remain streamable for entitled users.
- Track audio storage keys must not be permanent public CDN URLs (ADR-006). Covers may be public (ADR-020).
- Schema changes land in **both** gallery and CRM Prisma copies.
- Refund does not auto-delete ReleaseUnlock (ADR-018); CRM may revoke manually.

---

# CRM permissions (seed)

```text
music:read
music:write
music:publish
music:archive
```

---

# Future schema extensions (Phase 2+)

- Artist / featured collaborators tables
- Recurring billing fields / provider subscription ids
- Lyrics, music videos, audio quality variants
- DRM keys, download tokens
- Regional availability, promo codes, gift purchases, family memberships
- Materialized LibraryItem cache
