# Music Roadmap

> Version: 1.1  
> Status: Planning  
> Depends on: [product-music.md](./product-music.md), [music-implementation.md](./music-implementation.md)

---

# Purpose

Phased delivery for Music. Separates MVP from later work to prevent scope creep.

---

# Product Goals

Publish music directly to supporters before third-party platforms; keep direct artist–fan relationships; stay simple for the studio to operate via CRM.

---

# Implementation phasing

Follow [music-implementation.md](./music-implementation.md) Phases A→G.

Summary: schema → CRM Free publish → gallery Free stream → Paid tease cookie → CRM grants/Library → Order automation when Paystack fulfillment exists → analytics.

**Paid unlock checkout (gallery):** [plans/09-music-paid-unlock-checkout.md](./plans/09-music-paid-unlock-checkout.md) — tease → Unlock CTA → Paystack (KES) → `ReleaseUnlock` → unlimited play + Library.

---

# Platform prerequisite

**MVP:** CRM **manual grants** for unlocks and Studio Pass (ADR-019).

**In progress:** Music paid unlock checkout — see [plans/09-music-paid-unlock-checkout.md](./plans/09-music-paid-unlock-checkout.md). Checkout API accepts `releaseId`; fulfillment + gallery CTAs are the remaining work.

**Later:** Studio Pass purchase UI on Music home (same Order path, `MEMBERSHIP_PASS`).

Content publishing + Free streams + Paid 3-play tease can ship without automated payments; conversion requires Plan 09.

---

# MVP

## Artist (CRM)

- Create Release · Upload tracks · Public cover · Configure access/price · Membership plans · Publish / schedule / archive · **Manual grants** · Light analytics

## Fan (Gallery)

- Browse (badges) · Free stream · Paid 3-play tease · Unlock / Pass CTAs · Library · Streaming

**Paid unlock:** [plans/09-music-paid-unlock-checkout.md](./plans/09-music-paid-unlock-checkout.md)

## Platform

- Entitlements + play quota · Secure audio streaming · Order item types ready for when fulfillment lands · Search

**Not in MVP:** recurring membership billing, multi-artist accounts, downloads, auto-revoke on refund.

---

# Phase 1.5

Analytics depth · CRM UX polish · Gallery continue listening / featured shelves

---

# Phase 2

Richer album presentation · credits · collaborators · lyrics · videos · commentary · **recurring memberships** · gifts / promos

---

# Phase 3

Membership dashboard depth · fan profiles · release wishlists · notifications · early-access campaigns

---

# Phase 4

Multi-artist · distribution tooling · podcasts / audiobooks / livestreams · creator analytics

---

# Deferred

Downloads · offline · comments · social feeds · AI recommendations · playlist sharing

---

# Success Metrics

Artist: releases published, revenue, membership growth  
Fan: completion, purchases, return listens  
Platform: streaming reliability, conversion

---

# Note on “Albums”

`releaseType = ALBUM` is allowed in MVP as metadata. Roadmap “Albums” in Phase 2 means richer album UX — not blocking singles/EPs/albums as types in v1.
