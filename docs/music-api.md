# Music API Specification

> Version: 1.1  
> Status: Draft  
> Depends on:  
> - [product-music.md](./product-music.md)  
> - [music-domain.md](./music-domain.md)  
> - [music-schema.md](./music-schema.md)  
> - [music-payment.md](./music-payment.md)

---

# Purpose

Business operations for Music (capability list — not REST path design).

CRM staff ops are authorised via `music:*`. Fan ops use gallery session (`User`).

---

# Artist / Staff Operations (CRM)

## Create Release

Creates Draft. Not publicly visible.

## Upload Track / Cover

Attach private audio / cover assets. Draft/replace rules apply.

## Configure Access

Set access mode (FREE | PAID | MEMBERS_ONLY), price (editable anytime), paidPlayLimit (default 3). Optional stages.

## Manage Membership Plans

Create/update artist-defined Studio Pass plans (price, durationDays, active).

## Grant Unlock / Membership (MVP)

CRM assigns ReleaseUnlock or Membership to a gallery User without waiting for payment webhook.

## Schedule / Publish / Archive Release

As product lifecycle.

## View Analytics

MVP plays / purchases / revenue / tease exhaustion (light).

---

# Fan Operations (Gallery)

## Browse / View / Search Releases

Published catalogue; locked items included with badges.

## Play Release

Entitlement + Paid tease quota → short-lived stream auth.

## Purchase Release

When live: Order + OrderItem `RELEASE`.  
Until then: request path + CRM grant.

## Join Studio Membership

When live: Order + `MEMBERSHIP_PASS`.  
Until then: CRM grant against artist plan.

## View Library

ReleaseUnlocks + current member access.

---

# Shared Business Rules

- Only Published releases are discoverable.
- Purchases permanently unlock (Order-backed).
- Membership is temporary access.
- Downloads prohibited.
- Archived remain for entitled users.
- Media Blog audio is out of this API surface.

---

# Error Conditions

Release not found · unpublished · membership expired · purchase required · playback unavailable · payment failed · unauthorized · validation failed

---

# Future Operations

Gift · wishlist · playlist · lyrics · recommendations · distribution · recurring renewal
