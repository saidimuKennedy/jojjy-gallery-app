# Music Decisions (ADR)

> Version: 1.2  
> Depends on: [product-music.md](./product-music.md)

---

# Purpose

Architectural decisions for the Music module. Consult before adding functionality.

---

# ADR-001 — Streaming Only

**Status:** Accepted

Music is streamed only. Downloads are disabled.

---

# ADR-002 — Release-Centric Design

**Status:** Accepted

Fans purchase Releases, not individual tracks.

---

# ADR-003 — Membership Is Access

**Status:** Accepted

Membership grants temporary access only. Never ownership.

---

# ADR-004 — Purchases Are Permanent

**Status:** Accepted

Purchased releases remain playable / in Library forever unless staff manually revoke (see ADR-019).

---

# ADR-005 — Paid Tease = Three Plays

**Status:** Accepted (supersedes “preview seconds only”)

For **Paid** releases, listeners without a purchase may start playback **up to 3 times**. After the third play is consumed, further playback requires purchase (or a CRM manual grant).

This is a **play-count tease**, not a seconds-clip preview, for Paid mode.

Configurable `previewSeconds` may still exist for optional clip UX later; MVP paywall for Paid is driven by the **3-play quota**.

**Members-only** releases do not get this 3-play grant — membership (or purchase if mode later becomes Paid) is required for full play.

**Counting (product intent):** one “play” = one started full-playback session of the Release (not per-track). Anonymous listeners are included. Exact anonymous identity (cookie / fingerprint) is an engineering choice; quota must enforce the product rule.

---

# ADR-006 — No Public Audio URLs

**Status:** Accepted

Track audio is never permanently publicly addressable. Playback uses short-lived authorization.

Cover artwork **may** use public CDN (ADR-021).

---

# ADR-007 — Archive Instead of Delete

**Status:** Accepted

Published/sold releases are archived, not deleted.

---

# ADR-008 — Existing Commerce First

**Status:** Accepted

Integrate with `Order` / `OrderItem` / `PaymentProvider`. No parallel Music payment system. No standalone Purchase table.

---

# ADR-009 — One Music Module (CRM)

**Status:** Accepted

Music administration lives in the existing CRM app with `music:*` permissions.

---

# ADR-010 — MVP Before Scale

**Status:** Accepted

Design for **one studio Artist** while keeping multi-artist expansion possible later.

---

# ADR-011 — Publish State × Access Stage

**Status:** Accepted

**Publish state** (Draft / Scheduled / Published / Archived) is separate from **access mode/stage** (Free / Paid / Members only).

“Scheduled” is never an access mode.

---

# ADR-012 — Library Is a Projection

**Status:** Accepted

Library is derived from paid/manual RELEASE unlocks + active membership. A cache table is optional and never source of truth.

---

# ADR-013 — MVP Membership Is a Prepaid Pass

**Status:** Accepted

Studio Membership in MVP is a fixed-term pass. Recurring auto-renew is out of MVP.

**Term and price are artist-configured** in CRM via MembershipPlan(s) — not hardcoded in product docs (ADR-016).

---

# ADR-014 — Free Streams Without Login

**Status:** Accepted  
**Was:** OD-1

Anonymous listeners may fully stream releases whose current access mode is **Free**. Login is not required.

---

# ADR-015 — Members-Only Visible With Badge

**Status:** Accepted  
**Was:** OD-2

Members-only (and other locked) releases **appear in public browse** with a clear lock / access badge. They are not hidden from discovery.

---

# ADR-016 — Studio Pass Configured By Artist

**Status:** Accepted  
**Was:** OD-3

Duration, price, currency, and how many active plans exist are **set by the Artist (CRM staff)** — not frozen by engineering. Product only requires prepaid pass semantics (ADR-013).

---

# ADR-017 — Paid Stage Requires Purchase

**Status:** Accepted  
**Was:** OD-4

When access moves from Exclusive / Members-only to **Paid**, active members **do not** retain free access. They must **purchase** the Release (or rely on Free mode if it later becomes Free).

---

# ADR-018 — Manual Refund Handling

**Status:** Accepted  
**Was:** OD-6

Refunds do **not** auto-revoke entitlements in MVP. Revocation is **manual** (CRM) when needed.

---

# ADR-019 — Manual Entitlement Grants (MVP Commerce)

**Status:** Accepted  
**Was:** OD-7

Until shared Order payment fulfillment is live, Music unlocks and Studio Pass activations may be **granted manually in CRM** (and optionally recorded against an Order later). Automated Paystack/webhook fulfillment remains the long-term path (ADR-008).

---

# ADR-020 — Public Cover Artwork

**Status:** Accepted  
**Was:** OD-8

Release covers use the **existing public image pipeline** (e.g. Cloudinary), same class as merch/event images.

---

# ADR-021 — Price Editable Anytime

**Status:** Accepted  
**Was:** OD-9

Staff may edit Paid **price** after publish and after sales. Historical Order lines keep their paid `unitPrice`; new checkouts use the current price.

---

# Decided summary (OD-1 … OD-9)

| ID | Decision |
| --- | --- |
| OD-1 | Free: no login required |
| OD-2 | Locked releases visible with badge |
| OD-3 | Studio Pass term/price set by artist in CRM |
| OD-4 | After stage → Paid, members must buy |
| OD-5 | Paid: 3 plays then paywall (ADR-005) |
| OD-6 | Refund revoke: manual only |
| OD-7 | MVP grants: CRM manual until Order fulfillment live |
| OD-8 | Covers: public CDN |
| OD-9 | Price: editable anytime |

---

# ADR-022 — Anonymous Play Identity = Durable Cookie

**Status:** Accepted

Paid tease for anonymous listeners is keyed by a first-party **HTTP-only cookie** (`jg_music_aid` or similar): a random UUID set on first Music play, `SameSite=Lax`, long-lived (e.g. 1 year).

**Not** fingerprinting for MVP. Logged-in Users prefer `userId`; if both exist for the same browser, **merge quotas toward the User** on login (sum playCounts per release, cap at limit).

---

# ADR-023 — Studio Pass Stacking

**Status:** Accepted

When granting a new prepaid pass while Membership is ACTIVE:

```text
expiresAt = max(now, currentExpiresAt) + durationDays
```

Status stays ACTIVE. Cancelled/Expired starts fresh from `now + durationDays`.

---

# ADR-024 — Global Paid Play Limit (MVP)

**Status:** Accepted

MVP uses a **global** Paid tease of **3** plays (`AccessPolicy.paidPlayLimit` default 3). Per-release override in CRM is **not** required for MVP; schema may still store the field with default 3 for forward compatibility.

---

# Implementation guide

See [music-implementation.md](./music-implementation.md) for phased build order against the current gallery + CRM codebase.
