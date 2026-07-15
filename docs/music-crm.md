# Music CRM Specification

> Version: 1.1  
> Status: Draft  
> Depends on:  
> - [product-music.md](./product-music.md)  
> - [music-domain.md](./music-domain.md)  
> - [music-schema.md](./music-schema.md)

---

# Purpose

How authorised staff manage music in **jojjy-gallery-crm**.

CRM owns **content administration** only.

Playback, checkout, and Fan Library belong to the public gallery.

---

# Module Overview

New nav item alongside existing modules:

```text
… Merch · Announcements · Music · Staff
```

---

# Music Dashboard

- Draft / Scheduled / Published / Archived counts
- Light stats: releases, plays, purchases, revenue, active member listeners

---

# Release Management

Fields: title, description, release type, genre, release date, cover, artistName (MVP).

Types: Single, EP, Album, Live Session, Acoustic Session.

---

# Track Management

Per release: upload, reorder, rename, remove (while rules allow).

Tracks cannot exist independently. Storage uses private keys (not public permanent URLs).

---

# Access Configuration

Staff set:

- **access mode** — Free | Paid | Members only
- price / currency (when Paid) — **editable anytime**
- paid play limit (default 3)
- publish schedule (`publishAt` when Scheduled)
- MembershipPlan(s) — name, price, durationDays (artist-owned)
- optional access stages when that UI ships

Do not expose a “Scheduled” access mode.

---

# Manual Grants (MVP commerce)

Staff can:

- Grant Release unlock to a gallery User (creates ReleaseUnlock, source CRM_MANUAL)
- Grant / extend Studio Membership for a User
- Revoke unlock or cancel membership (manual refunds — ADR-018)

This is the primary paid path until Order fulfillment is live (ADR-019).

---

# Publication Workflow

```text
Draft → Scheduled → Published → Archived
```

Publish validates: metadata, cover, ≥1 track, configured access.

---

# Analytics

Per release (MVP): plays, purchases, revenue, preview basics.

Phase 1.5: unique listeners, duration, completion.

---

# Archive

- Drop from discovery
- Keep entitled playback
- No delete after purchase

---

# Permissions

```text
music:read
music:write
music:publish
music:archive
```

UI should eventually gate nav/actions by these keys (APIs must enforce).

---

# Validation / Errors

Cannot publish incomplete release · upload failed · invalid audio · permission denied · streaming asset unavailable · duplicate slug

---

# Out of Scope (CRM)

- Customer support console
- Automated payment capture UI (shared commerce when live)
- Recurring billing admin
- Full order administration
- Fan messaging
- DSP distribution
- Playlist management
- Treating Media Blog as Music
