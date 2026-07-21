# Jojjy Gallery — Launch Checklist

> Last audited: 2026-07-21  
> Status key: ✅ Complete · 🟡 Needs testing or polish · ❌ Not implemented · 🔵 Planned (v2)

This is the single source of truth for what stands between **today's codebase** and a product you can confidently put in front of an artist and their audience.

**Implementation plans:** step-by-step guides for each release blocker live in [`docs/plans/`](./docs/plans/README.md).

---

## Release Blockers

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Payment completion (artwork) | 🟡 | Paystack wired: checkout → redirect → webhook/verify → fulfillment. Set `PAYSTACK_SECRET_KEY` + webhook URL in Paystack dashboard. |
| Inventory on purchase | ✅ | `lib/orders/fulfill.ts` — artwork SOLD, tickets issued, variant stock decremented on PAID |
| Order confirmation / notifications | 🟡 | Confirmation page + SMTP email via existing `EMAIL_*` vars (optional) |
| CRM staff management | 🟡 | Staff CRUD APIs + UI; `staff:*` enforced. Role changes require re-login (JWT). |
| Ticket operations (CRM) | 🟡 | Edit + sales window; public buy → Paystack checkout |
| Permission cleanup | ✅ | `tickets:*` on ticket APIs; `staff:*` on staff routes/page; nav gated by permission |
| Unauthenticated write APIs (gallery) | ✅ | `POST/PUT/DELETE` removed from `pages/api/media-blog/*` — read-only public API |
| Migrations on production DB | ✅ | `prisma migrate status` — all 14 migrations applied (2026-07-21) |
| Image naming (Cloudinary) | ✅ | CRM upload uses slugified `artworkTitle` / filename as Cloudinary `public_id` |
| Deployment env | 🟡 | `.env.example` + `scripts/audit-env.mjs` exist. M-Pesa hardcoded to sandbox. `robots.txt` + `/sitemap.xml` added. Set `NEXT_PUBLIC_SITE_URL` on Vercel. |

---

## Core Product (Priority 0)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Authentication (visitors) | ✅ | NextAuth credentials: login, register, session. |
| Authentication (artist/staff) | ✅ | CRM at `jojjy-gallery-crm` — separate app, credentials login. |
| Upload artworks | ✅ | CRM: `pages/api/upload/image.ts` + ArtworkManagement UI. |
| Edit artworks | ✅ | CRM artwork CRUD with status, media, pricing. |
| Visitors browse | ✅ | Portfolio, artworks, archive, events, music, shop. |
| Visitors purchase | 🟡 | Checkout redirects to Paystack when configured |
| Payments complete | 🟡 | End-to-end when Paystack keys + webhook URL configured |
| Production deployment stable | 🟡 | Builds; DB migrations applied; configure Paystack on Vercel before launch |

---

## CRM (`jojjy-gallery-crm`)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Artworks CRUD | ✅ | Full management + Cloudinary upload. |
| Series CRUD | ✅ | Text fields; **no series media upload UI** (schema exists). |
| Events CRUD | ✅ | Create/edit, publish/unpublish (`DRAFT` → `PUBLISHED`). |
| Ticket types | 🟡 | Create/edit/delete + sales window in CRM UI. |
| Ticket check-in | ❌ | Schema has `checkedInAt`; no API or UI. |
| Merch / products | 🟡 | CRM merch page exists; gallery shop sells artworks only, not products. |
| Announcements (CRUD) | 🟡 | Save/publish to DB. Publish bug: `[id].ts` may clear `publishedAt`. |
| Announcement delivery (email) | ❌ | `emailSentAt` tracked; SendGrid not wired for blasts. |
| Announcement delivery (WhatsApp) | ❌ | `whatsappSentAt` tracked; Jiaminie not integrated. |
| Announcement delivery (notifications) | ❌ | No in-app notification system. |
| Staff: create | ✅ | CRM staff page + `POST /api/staff` |
| Staff: deactivate | ✅ | PATCH toggle `isActive` |
| Staff: assign role | ✅ | PATCH role on staff page |
| Staff: remove role | ✅ | Set role to empty via PATCH |
| Permission enforcement | ✅ | `tickets:*`, `staff:*` enforced; nav gated by permission |
| Analytics dashboard | ❌ | Dashboard is a link grid only — no revenue, orders, visitors, top artwork/event. |
| Music management | 🟡 | CRM music module exists; defer to v2 for public launch. |

---

## Public Gallery (Priority 2 — Polish)

| Page | Status | Notes |
| ---- | ------ | ----- |
| Home | ✅ | Landing page complete. |
| Archive (Journal) | ✅ | Infinite scroll, essays/film/photos. Nav label: "Archive". |
| Artwork detail | 🟡 | Image loading optimized (`OptimizedImage`, Cloudinary transforms). Purchase links to shop. Wishlist works. **No reserve/hold UI** (API exists). Similar works: verify. |
| Events index | ✅ | Editorial layout, capacity labels. |
| Event detail | ✅ | RSVP + paid ticket buy via Paystack (when configured). |
| Portfolio / series | ✅ | Exhibition pages with behind-the-scenes media. |
| About | 🟡 | Bio, stats, follow CTA. Older styling vs newer pages. |
| Contact | 🟡 | Form + SMTP email. No rate limit/CAPTCHA. |
| Studio Shop | 🟡 | Paystack checkout wired; cart drawer still orphaned. |
| Music | 🔵 | Public pages exist; defer to v2. |

---

## Commerce (Priority 3)

| Flow | Status | Notes |
| ---- | ------ | ----- |
| Artwork → checkout → payment → confirmation | 🟡 | Paystack redirect → confirmation page → verify/webhook |
| Order record | ✅ | `Order` + `OrderItem`; Paystack ref stored |
| Inventory update | ✅ | `lib/orders/fulfill.ts` on PAID |
| Merch variants (size/color/stock) | 🟡 | Schema + read API (`pages/api/products/*`). **No public merch UI.** Checkout backend supports `productVariantId`. |
| Event ticket purchase (public) | 🟡 | Buy ticket on event page → Paystack (RSVP remains for free events) |
| M-Pesa STK push | 🟡 | Legacy/deprecated; sandbox only |
| Paystack | 🟡 | Implemented — set `PAYSTACK_SECRET_KEY` + webhook URL |

---

## Forgotten / Deferred Features

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Wishlist | ✅ | API + toggle on artwork page + account list. |
| Subscribers | 🟡 | Logged-in "Follow the artist" on About/Account. No guest email subscribe UI. CRM doesn't use list for announcements. |
| Press mentions | 🟡 | Rendered on completed events. **No CRM management UI.** |
| Series media | 🟡 | Public UI on portfolio pages. **No CRM upload UI.** |
| Event gallery | ✅ | "Atmosphere" section on event detail. CRM: paste URL only. |
| Artwork reservations | 🟡 | API + `lib/reservations.ts` exist. **No public UI** on artwork/shop pages. |
| Public announcement page | ❌ | CRM publishes to DB; no public `/news` or feed. |

---

## Media & Images (Priority 5)

| Item | Status | Notes |
| ---- | ------ | ----- |
| Cloudinary URL transforms | ✅ | `lib/cloudinary.ts` — `f_auto`, `q_auto`, presets. |
| OptimizedImage component | ✅ | Used across gallery pages. |
| Upload protection | 🟡 | Gallery app has no upload routes. CRM uploads unauthenticated folder assignment. |
| Descriptive image names | ❌ | CRM: random public_ids. Should use artwork title slug or `use_filename`. |
| Image `order` field | ✅ | Sort index only (0, 1, 2…) — not a slug. CRM MediaBlog UI uses 1-based order labels. |
| Large / broken / duplicate uploads | 🟡 | Not systematically tested. |
| Deletion / replacement | 🟡 | CRM artwork edit supports URL changes; no dedicated media lifecycle tests. |

---

## Security (Pre-Launch)

| Control | Status | Notes |
| ------- | ------ | ----- |
| Admin route protection (CRM) | 🟡 | Middleware auth on `/dashboard/*`; no per-permission middleware. |
| Admin route protection (gallery) | ❌ | Open media-blog write APIs. |
| Rate limiting | ❌ | None on auth, contact, checkout, STK push, like/view. |
| CSRF | ❌ | No tokens; session cookies only for browser flows. |
| Input validation | 🟡 | Good on register/checkout; weak on contact form (HTML injection in email body). |
| Cloudinary signed URLs (music) | ✅ | `lib/music/playback.ts` for authenticated audio. |
| SEO meta | 🟡 | Basic `<title>` + description per page. No OG/Twitter/JSON-LD. |
| Sitemap | ✅ | Dynamic `/sitemap.xml` |
| robots.txt | ✅ | `public/robots.txt` |

---

## Analytics (Priority 4)

| Metric | Status | Notes |
| ------ | ------ | ----- |
| Revenue | ❌ | |
| Orders | ❌ | |
| Visitors | ❌ | `Artwork.views` incremented on gallery side; no CRM reporting. |
| Top artwork | ❌ | |
| Top event | ❌ | |
| Products sold | ❌ | |

---

## Version 2 (Do Not Block Launch)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Music streaming | 🔵 | Public pages + CRM module; full product in `docs/music-*.md`. |
| Membership | 🔵 | Schema hooks in checkout; not productized. |
| Music library | 🔵 | |
| Guest subscriber capture | 🔵 | |
| Press mentions CRM | 🔵 | |
| Series media CRM upload | 🔵 | |

---

## Recommended Sprint Order

### 🚀 Release Blockers (do first)

1. Fix image naming in CRM uploads (descriptive Cloudinary `public_id`)
2. Wire Paystack (or fix M-Pesa + callback) end-to-end
3. Inventory + order fulfillment on payment success
4. Protect or remove gallery media-blog write APIs
5. CRM staff CRUD + enforce `staff:*` / `tickets:*` (or remove dead keys)
6. Ticket sales window UI + checkout enforcement
7. Apply pending migrations to production (with user approval)
8. `robots.txt` + sitemap

### ✨ Polish

- Events typography/spacing (largely done; spot-check mobile)
- About/Contact styling consistency
- Artwork reserve/hold UI
- Merch public shop + variant selector
- Event ticket purchase on public event page
- Announcement delivery pipeline

### 📊 Business

- CRM analytics dashboard (revenue, orders, views, top content)

### 🎵 Version 2

- Music, membership, streaming, library

---

## Architecture Note: Image Slugs

Images do **not** have a `slug` column. Identity is:

- Full Cloudinary URL in `url` / `imageUrl`
- Optional human `description`
- Integer `order` for gallery sort (not a slug)

**Problem:** CRM uploads assign random Cloudinary public_ids (`artwork_uploads/<hash>`). Seeds use descriptive names (`Dawn_km3ucm.jpg`).

**Fix (CRM):** Pass slugified artwork title to upload:

```ts
cloudinary.uploader.upload(filepath, {
  folder: "artwork_uploads",
  public_id: slugify(artworkTitle),
  overwrite: false,
});
```

**Optional (gallery):** Add `slug` to `MediaBlogEntry` / artworks for routes like `/gallery/dawn` instead of `/gallery/5`.

---

## Repos

| Repo | Role |
| ---- | ---- |
| `jojjy-gallery-app` | Public site + read APIs + checkout |
| `jojjy-gallery-crm` | Staff admin, uploads, content CRUD |

Both share the same Prisma schema and database.
