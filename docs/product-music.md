# Music Product Specification

> Version: 1.2  
> Status: Product lock (draft for engineering)  
> Role: **North star** for Music. Domain, schema, CRM, gallery, API, and payment docs must follow this file.  
> Stack alignment: public gallery app (`jojjy-gallery-app`) + staff CRM (`jojjy-gallery-crm`) + shared Postgres. Fan identity = gallery `User`. Commerce = existing `Order` / `OrderItem` / `PaymentProvider` (plus CRM manual grants while payment fulfillment is unfinished). Staff publish = CRM with `music:*` permissions.  
> Locked decisions: see [music-decisions.md](./music-decisions.md) ADR-014 … ADR-021 and ADR-005.

---

## 1. Vision

Jojjy Music exists so the studio can release music **to its own audience first** — the same visitors who walk the gallery ladder from discovery to patron — before the work goes to third-party platforms. Music is treated as premium artistic work in the gallery ecosystem, not as an infinite streaming catalogue. Exclusivity, direct support (purchase and Studio Membership), and storytelling sit beside exhibitions, events, and the shop.

---

## 2. Goals

- Give the studio a **first window** for new releases.
- Let fans **support the artist directly** through purchase and membership.
- Generate **direct revenue** without building a parallel shop.
- Reward loyal supporters with **early and members-only access**.
- Allow releases to move **out of exclusivity into wider / free access** over time.
- Keep administration inside the **existing CRM**, and fan experience inside the **existing gallery app**.

---

## 3. User Roles

Product roles only (not security ACLs):

```text
Artist  →  Fan  →  Studio Member
```

| Role | Meaning in this product |
| --- | --- |
| **Artist** | Creator/owner of music. In MVP this is the gallery studio, operated by CRM staff with music permissions — not a separate public “artist account”. |
| **Fan** | Gallery visitor (anonymous OK for discovery, Free streams, Paid tease) or logged-in `User` for purchase, membership, Library. |
| **Studio Member** | A Fan with an **active membership entitlement**. Gains temporary access to member/exclusive content. Does not own releases. |

Staff who publish music are CRM users (`CrmUser`), not gallery customers.

---

## 4. Core Concepts

| Term | Definition |
| --- | --- |
| **Release** | The publishable unit (single, EP, album, live/acoustic session). Fans unlock **whole releases**, never individual tracks. |
| **Track** | One playable audio file that belongs to a Release. |
| **Play tease (Paid)** | Listeners without a purchase get **up to 3 plays** of a Paid release; after that, purchase (or CRM grant) is required. |
| **Access mode** | How a published release is unlocked today: Free, Paid, or Members only. |
| **Purchase** | Permanent unlock of a Release (stream only). Product vocabulary; implemented as a paid commerce order line and/or CRM manual grant — not a separate payment system. |
| **Membership** | Temporary access granted by Studio Membership (artist-configured pass). Never ownership. |
| **Library** | The Fan’s view of releases they can fully play — purchased (forever) plus currently entitled member releases. |
| **Publish state** | Whether the release exists for the world: Draft, Scheduled, Published, Archived. |
| **Access stage** | Optional time-based exclusivity ladder while published (e.g. members → paid → free). Independent of publish state. |

Editorial audio in Media Blog remains a separate product surface (archive/journal). It is **not** a Music Release.

---

## 5. Release Lifecycle

Two axes — do not collapse them into one enum.

### Publish state (canonical)

```text
Draft  →  Scheduled  →  Published  →  Archived
```

| State | Behaviour |
| --- | --- |
| **Draft** | CRM only. Incomplete OK. Not discoverable. No public stream. |
| **Scheduled** | Validated and queued for a publish time. Not discoverable until that time (or until staff publish). |
| **Published** | Discoverable (locked items show badge). Eligible for Free / Paid tease / member / owned rules. |
| **Archived** | Removed from discovery. Remains playable for entitled users (purchasers; members only while membership is active and policy still allows). Never hard-deleted after it has been purchased. |

### Access stage (while Published — optional exclusivity ladder)

```text
Exclusive (members)  →  Paid  →  Free / Public
```

Stages may be **skipped**. Timing is staff-configured. “Exclusive” here means **Members only**, not a fourth publish status.

“Coming soon” in the UI maps to **Scheduled** publish state (or published with future access window) — it is **not** an access mode.

---

## 6. Access Models

How a Fan unlocks full playback of a **Published** release:

| Model | Behaviour |
| --- | --- |
| **Free** | Full stream for **anyone**, including anonymous (no login). |
| **Paid** | Up to **3 plays** without purchase; then paywall. Permanent unlock after payment or CRM grant. Listed publicly. |
| **Members only** | Visible in browse with a **lock badge**. Full stream only while Studio Membership is active. No 3-play tease. When the release later becomes Paid, members **must buy** to keep access. |
| **Coming soon** | Not an unlock model — release is not yet available (scheduled publish). |

A release has **one active access mode** at a time. Changing mode/stage over time is how exclusivity ladders run.

---

## 7. Membership Model

**Studio Membership** rewards supporters with temporary access to member/exclusive releases (and future member benefits).

| Topic | MVP rule |
| --- | --- |
| What members get | Access to releases whose **current** access mode/stage is Members only / Exclusive. |
| What members do **not** get | Ownership; downloads; access after the release moves to **Paid** (must purchase); library retention of member-only titles after expiry. |
| On expiry / cancel | Member-only items leave the Library immediately. Purchased releases stay. |
| Pass configuration | **Artist sets** Studio Pass term, price, and plan(s) in CRM. |
| Billing (MVP) | Prepaid pass via Order when fulfillment is live; until then **CRM manual membership grants**. **No auto-renew in MVP.** |
| Billing (later) | Recurring subscriptions are Phase 2+. |

Membership never creates a Purchase/ownership record.

---

## 8. Purchase Model

| Rule | Detail |
| --- | --- |
| What is bought | One Release (all of its tracks). |
| Permanence | Unlock survives membership end, price changes, and later Free stage. |
| Before buy (Paid) | Up to **3 plays**, then paywall. |
| Delivery | **Streaming only**. No downloads in MVP. Free needs no login; owned/member streams use the entitled identity. |
| Library | Purchased / CRM-granted releases always appear in Library. |
| Commerce | Prefer existing `Order` + `OrderItem` (`RELEASE`). MVP may **grant unlocks manually in CRM** until Order payment fulfillment is live. No parallel payment stack. |
| Price | Staff may **edit price anytime**; past orders keep their line price. |
| Refunds | No auto-revoke in MVP — **manual** entitlement changes in CRM if needed. |
| History | Order history when paid via Order; CRM grant log for manual unlocks. |

---

## 9. Playback Experience

Product behaviour only:

- Streaming only; no download affordance.
- **Free:** full play, anonymous OK.
- **Paid (not owned):** up to 3 plays, then purchase CTA.
- **Members only:** lock badge in UI; full play only with active membership.
- Persistent on-site player while navigating the gallery.
- Seek / pause / resume / skip tracks within the current Release.
- Track audio must not be permanent public URLs; **covers may be public**.

---

## 10. User Library

Library contains **exactly**:

```text
Purchased Releases
+
Releases currently accessible via active Membership
```

Nothing else (no editorial Media Blog items, no wishlisted-only titles in MVP).

| Source | Retention |
| --- | --- |
| Purchase | Permanent |
| Membership | Only while membership is active **and** the release still grants member access |

Library is a **projection of entitlements**, not an independent ownership ledger.

---

## 11. Artist Workflow

CRM (staff acting for the Artist):

```text
Upload tracks + cover
→ Metadata
→ Access mode / price / schedule / Membership plans
→ Publish (or schedule)
→ Manual grants as needed
→ Analytics
→ Archive when appropriate
```

Publishing requires title, cover, ≥1 track, and configured access. Deletion after purchase is prohibited; archive instead.

---

## 12. Fan Journey

```text
Discover  →  Listen (Free / 3-play tease / member)  →  Unlock (buy or join)  →  Library  →  Keep listening
```

Aligned with the broader gallery ladder: deepen relationship with the artist; buying is support, not the only entry point.

---

## 13. Analytics

**MVP (artist/staff facing in CRM)**

- Plays
- Purchases (count)
- Revenue (from music order lines)
- Active member listeners (light)

**Phase 1.5**

- Unique listeners, listening duration, completion rate, revenue charts, preview completion depth

Analytics must not block playback.

---

## 14. MVP Scope (frozen)

**In**

| Surface | Capabilities |
| --- | --- |
| CRM | Create/edit Release & Tracks, public cover, access mode/price, schedule/publish/archive, MembershipPlan(s), **manual grants** (unlock + membership), light analytics, `music:*` |
| Gallery | Music nav, browse (locked = badge), release detail, Paid 3-play tease, purchase CTA, Studio Pass CTA, Library, stream, persistent player |
| Platform | Entitlement + 3-play quota, Order types when ready (`RELEASE`, `MEMBERSHIP_PASS`), secure audio streaming, dual-schema Prisma mirror |

**MVP commerce path:** CRM manual grants first; automated Order fulfillment when shared Paystack/webhook path is live.

**Out of MVP**

- Recurring membership billing
- Downloads / offline
- Playlists, comments, social feeds, recommendations
- Multi-artist accounts / catalogue of many artists
- Lyrics sync, music videos, gifts, coupons, family plans
- Parallel Purchase table or Music-specific payment provider

---

## 15. Phase 2+

Intentional backlog (not commitments):

- Recurring Studio Membership
- Richer album UX / credits / featured collaborators
- Lyrics, commentary, music videos
- Gifts, promo codes, event-tied exclusives
- Multi-artist creator ecosystem
- ABR / stronger DRM evaluation
- Wishlists for releases, notifications, fan profiles

Still deferred unless re-opened: downloads, offline playback, AI recommendations, playlist sharing.

---

## Locked decisions

OD-1 … OD-9 and engineering defaults ADR-022 … ADR-024 are accepted in [music-decisions.md](./music-decisions.md). Build order: [music-implementation.md](./music-implementation.md).
