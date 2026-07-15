# Music Authentication & Entitlements

> Version: 1.2  
> Status: Engineering Design  
> Depends on:  
> - [product-music.md](./product-music.md)  
> - [music-domain.md](./music-domain.md)  
> - [music-schema.md](./music-schema.md)  
> - [music-streaming.md](./music-streaming.md)  
> - [music-decisions.md](./music-decisions.md)

---

# Purpose

Authentication, authorization, and entitlement resolution for Music.

---

# Authentication

**Public visitors (anonymous)**

- Browse releases including locked ones (badge — ADR-015)
- Fully stream **Free** releases (ADR-014)
- Consume **Paid** 3-play tease (ADR-005)

**Authenticated gallery Users**

- Purchase releases (when Order path is live)
- Hold Studio Membership / receive CRM grants
- Access Library
- Stream owned / member / free / remaining tease plays

**CRM staff** — `CrmUser` + `music:*` (publish + **manual grants**)

Fan identity is never `CrmUser`.

---

# Authorization (CRM)

```text
music:read
music:write
music:publish
music:archive
```

Manual grant of unlock/membership should require `music:write` (or a dedicated grant permission later).

---

# Entitlement Sources (MVP)

Full unlimited playback may come from:

1. Free access mode
2. ReleaseUnlock (Order payment **or** CRM_MANUAL)
3. Active Membership when current mode is MEMBERS_ONLY

**Limited** playback:

4. Paid mode with playCount < paidPlayLimit (default 3)

---

# Entitlement Resolution

**Step 1 — Catalogue state**

- Missing → Deny  
- DRAFT / SCHEDULED → Deny  
- PUBLISHED / ARCHIVED → continue  

**Step 2 — Current access mode**

From AccessStage at `now`, else AccessPolicy.

**Step 3 — Free**

If FREE → Allow (anonymous OK).

**Step 4 — Unlock**

If ReleaseUnlock for User → Allow.

**Step 5 — Members only**

If MEMBERS_ONLY and ACTIVE Membership covering now → Allow.  
Else if MEMBERS_ONLY → Deny (no 3-play tease).

**Step 6 — Paid tease**

If PAID and no unlock:

- playCount < limit → Allow and increment on play start  
- else → Deny (purchase / grant required)

Members who only have membership while mode is PAID → Deny (ADR-017).

**Step 7 — Else Deny**

---

# Library Resolution

```text
ReleaseUnlock for User
+ MEMBERS_ONLY releases while Membership ACTIVE
```

---

# Security Principles

Never trust client entitlement or play-count alone — enforce quota server-side (`jg_music_aid` cookie + optional user id; ADR-022). Merge anon→user quotas on login.

Client receives authorization result + short-lived playback token only.

---

# Audit Logging

Purchase/grant unlocks · membership grants/expiries · tease exhausted · playback denials · CRM permission failures · manual revokes

---

# Future Entitlements

Promotional access, gifts, beta listeners, regional licensing, event-exclusive, patron tiers.
