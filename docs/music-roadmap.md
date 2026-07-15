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

---

# Platform prerequisite

**MVP:** CRM **manual grants** for unlocks and Studio Pass (ADR-019).

**Later:** Music paid unlock and Studio Pass use the shared gallery `Order` payment confirmation path with tickets/merch.

Content publishing + Free streams + Paid 3-play tease can ship without automated payments.

---

# MVP

## Artist (CRM)

- Create Release · Upload tracks · Public cover · Configure access/price · Membership plans · Publish / schedule / archive · **Manual grants** · Light analytics

## Fan (Gallery)

- Browse (badges) · Free stream · Paid 3-play tease · Unlock / Pass CTAs · Library · Streaming

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
