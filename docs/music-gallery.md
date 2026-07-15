# Music Gallery Specification

> Version: 1.1  
> Status: Draft  
> Depends on:  
> - [product-music.md](./product-music.md)  
> - [music-domain.md](./music-domain.md)  
> - [music-entitlements.md](./music-entitlements.md)

---

# Purpose

Fan-facing Music experience in **jojjy-gallery-app**: discovery, preview, unlock, membership, library, streaming.

---

# Design Philosophy

Extension of the artist’s gallery — not a generic streaming app.

Priorities: discovery, storytelling, exclusivity, direct support.

Music Releases are distinct from Media Blog / Archive editorial audio.

Locked releases **stay visible** with a clear access badge (ADR-015).

---

# Navigation

Primary nav item **Music** (alongside Archive, Events, Studio Shop, etc.).

---

# Music Home

Featured / latest / member exclusives / upcoming / popular — as content allows.

Members-only and Paid-locked titles remain listed with badges.

---

# Release Card

Cover, title, type, artistName, duration, access indicator:

```text
Free | Members Only | Purchase | Coming Soon
```

---

# Release Details

Cover, title, description, genre, duration, release date, track list, player.

| State | Behaviour |
| --- | --- |
| Free | Full play, no login |
| Paid + plays left | Play; show remaining tease count |
| Paid + exhausted | Paywall CTA (purchase / request access) |
| Members only + member | Full play |
| Members only + non-member | Lock + Studio Pass CTA |
| Owned (unlock) | Full play + in Library |

---

# Paid play tease

Up to **3 plays** without purchase (ADR-005). After that, unlock required.

---

# Unlock (Purchase)

When Order path is live: existing payment options + `RELEASE` order line.

Until then: CTA can route to account/contact; staff grant in CRM.

Success / grant → immediate unlock + Library.

---

# Membership

CTA to join **Studio Pass** plans configured by the artist (price/term from CRM).

Copy: exclusives while member; **does not grant ownership**; if a release becomes Paid, **purchase required**.

Do not confuse with “Follow the artist” / `Subscriber` opt-in.

---

# Library

- Unlocked Releases (order or CRM grant)
- Member-accessible Releases while membership active

---

# Playback

Stream only · play/pause/seek/skip within Release · persistent site player · no downloads.  
Free anonymous OK. Track audio private; covers public.

---

# Search

Release title, track title, genre (MVP).

---

# Empty / Error States

No releases · empty library · membership required · coming soon · playback unavailable · membership expired · purchase required · network error

---

# Accessibility

Keyboard-accessible controls · alt text on artwork · ARIA on audio controls

---

# Out of Scope

Downloads · playlists · comments · social feeds · recommendations · offline listening
