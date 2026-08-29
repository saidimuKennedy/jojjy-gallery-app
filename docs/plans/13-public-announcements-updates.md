# Plan 13 — Public Announcements (Updates) Page

**Status:** Complete (2026-07-27)  
**Repo:** `jojjy-gallery-app` (primary)  
**Effort:** S (½–1 day)  
**Blocks launch:** No — polish; makes CRM publish meaningful on-site  
**Depends on:** [Plan 12 — Announcement publish fix](./12-announcement-publish-fix.md) ✅  
**Follows:** Agreed queue — Plan 12 → **this** → Paystack smoke

**Related:** [LAUNCH_CHECKLIST.md](../../LAUNCH_CHECKLIST.md) (Public announcement page ❌) · [Plan 11 — Audience](./11-audience-newsletter-mvp.md) · [email-resend.md](../email-resend.md)

---

## Thesis

CRM can publish announcements. Visitors still have nowhere to read them.

Ship a quiet public **Updates** feed so “Publish” has an on-site destination — **without** email, WhatsApp, or notify-subscribers. Domain/Resend stays deferred.

```text
CRM Publish → publishedAt set
                ↓
         Public /updates  (this plan)
                ↓
    (later) Email blast via Resend
```

---

## Goal

A visitor can open a public page, see published announcements newest-first, and optionally follow a linked event. Drafts never appear.

---

## Naming

| Surface | Label |
| ------- | ----- |
| URL | **`/updates`** (canonical) |
| Nav | **Updates** |
| Page title | Updates — Njenga Ngugi |
| CRM | Keep “Announcements” (staff language) |

Avoid “News” / “Announcements” in public nav — **Updates** matches studio tone and pairs with `/subscribe` (“Stay Close to the Work”).

Optional later: redirect `/news` → `/updates`.

---

## What we have today

| Area | Status |
| ---- | ------ |
| `Announcement` model | ✅ title, body, eventId, publishedAt, … |
| CRM CRUD + publish | ✅ Plan 12 |
| Public read API | ❌ None in gallery |
| Public page | ❌ |
| Nav / footer link | ❌ |
| Sitemap entry | ❌ |
| Email on publish | ❌ Out of scope |

---

## Scope

### In scope

- `GET /api/announcements` (gallery) — published only
- `/updates` index page — editorial list
- Optional detail route **`/updates/[id]`** if body is long enough to warrant it; otherwise index-only with full body inline (prefer **index-only** for MVP — one page, less chrome)
- Nav link **Updates** (and Footer text link optional)
- Sitemap + soft CTA to `/subscribe`
- Empty state when none published

### Out of scope

- Email / Resend / WhatsApp delivery
- Audience “notify on publish”
- RSS / Atom
- Announcement images / rich media
- Slugs (use numeric `id` if detail added later)
- Pagination (add if list grows; v1 can load all published)
- CRM changes (unless a “View public page” link is a 5-minute nicety)

---

## Public API

### `GET /api/announcements` (gallery app)

| Rule | Detail |
| ---- | ------ |
| Auth | Public |
| Filter | `publishedAt != null` |
| Order | `publishedAt desc` |
| Cache | `setPublicCacheHeaders` like events (`sMaxAge` ~300) |
| Shape | `{ id, title, body, publishedAt, event: { id, title, slug } \| null }` |

Do **not** expose drafts, `emailSentAt`, or internal timestamps beyond `publishedAt` / `createdAt` if useful.

Suggested data helper: `lib/data/announcements.ts` → `getPublishedAnnouncements()` (mirrors `lib/data/events.ts`).

---

## Public UI — `/updates`

### Layout (one job)

```text
Updates

Notes from the studio — exhibitions,
releases, and gatherings.

────────────────────────────

12 July 2026
Groove Sunday
It is going to be awesome.
→ Studio Opening – Nairobi   (if event linked)

────────────────────────────

…

[ Stay close — subscribe ]
```

### Rules

- Match gallery typography (`font-display`, light neutrals) — same family as Events / Subscribe
- **No cards** unless needed for interaction; prefer hairline separators / spacing
- Newest first
- Linked event → `/events/[slug]` when present
- Empty: short line + link to `/subscribe` or Events
- Footer CTA block: link to `/subscribe` (text only; form stays on subscribe page)
- Motion: light stagger on list items (optional, 1–2 motions max)

### Nav

Add `{ label: "Updates", path: "/updates" }` near Events / About (suggest after Events).

Footer: optional “Updates” text link beside Subscribe / Contact.

### Sitemap

Add `/updates` to `pages/sitemap.xml.ts` static pages.

---

## Implementation steps

1. **Data + API** — `getPublishedAnnouncements` + `pages/api/announcements/index.ts`
2. **Page** — `pages/updates.tsx` (SWR or `getServerSideProps` / static with revalidate — prefer SWR + public API to match Events, or SSR for SEO; either fine; **SSR/`getServerSideProps` is slightly better for a content feed**)
3. **Nav + Footer** links
4. **Sitemap** entry
5. **Smoke** — publish “Groove Sunday” in CRM → appears on `/updates`; unpublish → disappears; draft never listed

---

## Files to touch

| File | Change |
| ---- | ------ |
| `lib/data/announcements.ts` | **New** |
| `pages/api/announcements/index.ts` | **New** public GET |
| `pages/updates.tsx` | **New** |
| `components/ui/Navbar.tsx` | Add Updates |
| `components/ui/Footer.tsx` | Optional Updates link |
| `pages/sitemap.xml.ts` | Include `/updates` |

---

## Success criteria

1. Published announcements appear on `/updates` newest-first.  
2. Drafts never appear.  
3. Unpublish removes from public list (after cache TTL if cached).  
4. Event link works when set.  
5. Nav reaches the page; sitemap lists it.  
6. No email sent.

---

## Effort split

| Slice | ~Time |
| ----- | ----- |
| API + data helper | 20–30 min |
| `/updates` page + empty/subscribe CTA | 1–2 h |
| Nav / footer / sitemap | 15 min |
| Smoke with CRM publish | 15 min |

---

## Next after this

Paystack end-to-end smoke (Plan 02 / launch checklist) — commerce gate, still no domain required for Resend.
