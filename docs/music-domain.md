# Music Domain Model

> Version: 1.1  
> Status: Draft  
> Depends on: [product-music.md](./product-music.md)

---

# Purpose

This document defines the business domain vocabulary for the Music module within Jojjy Gallery.

It does **not** describe database tables, APIs, or frontend implementation.

Frontend, backend, CRM, and schema work must use these terms consistently with the product north star.

---

# Domain Overview

The Music module revolves around one idea:

> The studio publishes **Releases** that Fans may access according to the release’s current **access mode** (and optional **access stage** over time).

Unlike streaming platforms, Jojjy Gallery focuses on direct artist-to-fan relationships.

Music is premium digital content in the gallery ecosystem — not an infinitely available catalogue.

Commerce and identity reuse the gallery’s existing Fan (`User`) and Order-based checkout. Staff act as the Artist through the CRM.

---

# Primary Actors

## Artist

The creator and owner of music.

In MVP there is **one studio Artist**. Day-to-day publishing is done by authorised CRM staff on behalf of that Artist.

Responsibilities

- Upload releases
- Configure access
- Publish / schedule / archive releases
- Monitor analytics

Multi-artist identity is out of MVP (see product Phase 2+ / ADR-010).

---

## Fan

Public visitor of the gallery (anonymous for browse, Free streams, and Paid 3-play tease; authenticated gallery `User` for purchase, membership, and Library).

Can

- Discover music (including locked releases with badges)
- Stream Free releases without logging in
- Use up to 3 plays on Paid releases before unlock
- Purchase releases
- Become a Studio Member (artist-configured pass)

---

## Studio Member

A Fan with an **active membership entitlement**.

Inherits all Fan capabilities.

Additional privileges

- Early / Exclusive (members-only) releases while membership is active
- Member-only access modes

Membership is **temporary access**, not ownership.

---

# Core Concepts

## Release

The publishable unit.

Examples: Single, Album, EP, Live Session, Acoustic Session.

A Release owns one or more Tracks. Every purchase unlocks an entire Release.

## Track

A single playable audio file. Tracks cannot exist without a Release.

## Play tease (Paid)

Listeners without a purchase may start playback of a **Paid** release up to **3 times**. After that, purchase (or CRM grant) is required.

Members-only releases do not receive this tease.

## Access mode

How full unlocked playback works **right now** for a Published release:

- Free — anyone, including anonymous
- Paid — 3-play tease, then purchase / grant
- Members only — active Studio Membership (visible in browse with lock badge)

“Coming soon” / scheduled appearance is **publish state**, not an access mode.

## Access stage

Optional exclusivity ladder over time while Published:

```text
Exclusive (members)  →  Paid  →  Free / Public
```

Stages may be skipped. Timing is configured by staff.

## Publish state

```text
Draft  →  Scheduled  →  Published  →  Archived
```

Independent of access mode/stage.

## Library

The Fan’s collection of Releases they can fully play.

Items appear from:

- Purchase (permanent)
- Active Membership (temporary, when the release grants member access)

Library is a **projection of entitlements**, not a separate ownership system.

## Membership

Temporary access granted by Studio Membership.

MVP delivery (product): **prepaid membership pass** with artist-configured term/price — not recurring billing. Grants may be applied manually in CRM until Order fulfillment is live.

Membership never transfers ownership and never creates a Purchase.

## Purchase

Permanent unlock of a Release (stream only).

Purchases survive membership cancellation, pricing changes, and later Free stage.

In the platform, a Purchase is **realized as** a paid Order line (`RELEASE`) **and/or** a CRM manual unlock grant — domain language stays “Purchase”; data/commerce docs must not invent a parallel payment entity.

## Media Blog audio (out of this domain)

Editorial `AUDIO` entries in Media Blog are not Releases. They are not entitled, sold, or listed in the Music Library.

---

# Release Lifecycle

## Publish state

Draft → Scheduled → Published → Archived

## Access stage (optional, while Published)

Exclusive (members) → Paid → Free / Public

---

# Ownership Rules

- Purchases grant permanent access (auto-revoke on refund is out of MVP — manual only).
- Membership grants temporary access; when a release becomes Paid, members must buy.
- No downloadable audio in MVP.
- Free streams are anonymous-friendly; Paid tease uses a 3-play quota; owned/member full access uses entitlements.
- Archived releases remain accessible to entitled users (purchasers/grants always; members only while entitled and mode still members-only).

---

# Relationships

```text
Artist (studio)
  → creates Release
    → contains Tracks
    → has current Access mode (+ optional Access stages over time)
    → unlocked by Purchase or Membership
    → visible in Library (projection)
```

Fan identity for unlock/library is the gallery User. Staff publishing is CrmUser.

---

# Business Rules

- A Release belongs to one Artist (studio) in MVP.
- A Track belongs to one Release.
- A Fan cannot purchase individual Tracks.
- Purchases unlock entire Releases.
- Membership never grants ownership.
- Downloads are disabled.
- Only Published releases are discoverable (Archived are not).
- Archived Releases remain in purchaser libraries.
- Music commerce uses the existing Order model.

---

# Out of Scope (MVP)

- Playlists
- Collaborative / featured artists
- Podcasts
- Comments
- Offline playback
- DRM beyond authenticated streaming + non-public audio URLs
- Lyrics synchronisation
- Recurring subscription billing
- Parallel Music-only payment systems
- Treating Media Blog as Music catalogue
