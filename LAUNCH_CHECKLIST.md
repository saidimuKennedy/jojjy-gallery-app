# Jojjy Gallery — Launch Checklist

> Last audited: 2026-07-21  
> Status key: ✅ Complete · 🟡 Needs testing or polish · ❌ Not implemented · 🔵 Planned (v2)

This is the single source of truth for what stands between **today's codebase** and a product you can confidently put in front of an artist and their audience.

---

## Release Blockers

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Payment completion (artwork) | ❌ | Studio Shop creates PENDING orders only (`pages/shop/[id].tsx` → `pages/api/orders/checkout.ts`). Paystack not wired. Legacy M-Pesa path has response-shape bug (`stkData.CheckoutRequestID` vs nested `stkData.data.CheckoutRequestID`). No callback/webhook to finalize orders. |
| Inventory on purchase | ❌ | Checkout validates stock but never decrements artwork status, ticket `quantitySold`, or variant stock. |
| Order confirmation / notifications | ❌ | Toast only. No email, no webhook fulfillment. |
| CRM staff management | ❌ | Read-only role catalog in CRM (`jojjy-gallery-crm/pages/dashboard/staff.tsx`). No create/deactivate/assign/remove APIs. |
| Ticket operations (CRM) | 🟡 | Ticket types: create/delete only. No sales window UI, no qty edit, no check-in. `salesStart`/`salesEnd` not enforced at checkout. |
| Permission cleanup | 🟡 | `tickets:*` and `staff:*` seeded in CRM but **never enforced**. Ticket APIs use `events:*` instead. Staff page has no gate. |
| Unauthenticated write APIs (gallery) | ❌ | `POST/PUT/DELETE` on `pages/api/media-blog/*` have no auth — anyone can mutate archive entries. |
| Migrations on production DB | 🟡 | Three hand-written migrations exist; **not applied** to live DB per handoff doc. Run only after user approval with `prisma migrate deploy`. |
| Image naming (Cloudinary) | 🟡 | CRM uploads use random hashes (`artwork_uploads/iubffyxdm2cffywrehvk`), not descriptive names. Seeds use good names (`Dawn_km3ucm.jpg`). Fix in CRM upload handler. |
| Deployment env | 🟡 | `.env.example` + `scripts/audit-env.mjs` exist. M-Pesa hardcoded to sandbox. No `robots.txt` or sitemap. |

---

## Core Product (Priority 0)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Authentication (visitors) | ✅ | NextAuth credentials: login, register, session. |
| Authentication (artist/staff) | ✅ | CRM at `jojjy-gallery-crm` — separate app, credentials login. |
| Upload artworks | ✅ | CRM: `pages/api/upload/image.ts` + ArtworkManagement UI. |
| Edit artworks | ✅ | CRM artwork CRUD with status, media, pricing. |
| Visitors browse | ✅ | Portfolio, artworks, archive, events, music, shop. |
| Visitors purchase | 🟡 | Browse + checkout form work; payment does not complete. |
| Production deployment stable | 🟡 | Builds; live DB migrations pending; commerce not end-to-end. |

---

## CRM (`jojjy-gallery-crm`)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Artworks CRUD | ✅ | Full management + Cloudinary upload. |
| Series CRUD | ✅ | Text fields; **no series media upload UI** (schema exists). |
| Events CRUD | ✅ | Create/edit, publish/unpublish (`DRAFT` → `PUBLISHED`). |
| Ticket types | 🟡 | Create/delete; no update, no sales window fields in UI. |
| Ticket check-in | ❌ | Schema has `checkedInAt`; no API or UI. |
| Merch / products | 🟡 | CRM merch page exists; gallery shop sells artworks only, not products. |
| Announcements (CRUD) | 🟡 | Save/publish to DB. Publish bug: `[id].ts` may clear `publishedAt`. |
| Announcement delivery (email) | ❌ | `emailSentAt` tracked; SendGrid not wired for blasts. |
| Announcement delivery (WhatsApp) | ❌ | `whatsappSentAt` tracked; Jiaminie not integrated. |
| Announcement delivery (notifications) | ❌ | No in-app notification system. |
| Staff: create | ❌ | Seed/bootstrap only. |
| Staff: deactivate | 🟡 | `isActive` checked at login; no admin toggle. |
| Staff: assign role | ❌ | Manual DB/seed. |
| Staff: remove role | ❌ | No API. |
| Permission enforcement | 🟡 | `artworks:*`, `series:*`, `events:*`, `merch:*`, `announcements:*`, `music:*` enforced on APIs. `tickets:*`, `staff:*` unused. Nav shows all modules to every user. |
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
| Event detail | ✅ | Cinematic layout, RSVP, atmosphere gallery, press (past events). **No paid ticket purchase.** |
| Portfolio / series | ✅ | Exhibition pages with behind-the-scenes media (`SeriesMediaFile`). |
| About | 🟡 | Bio, stats, follow CTA. Older styling vs newer pages. |
| Contact | 🟡 | Form + SendGrid email. No rate limit/CAPTCHA. Placeholder phone. |
| Studio Shop | 🟡 | Artwork checkout form; payment stub. Cart drawer orphaned (`AddToCartButton` never imported). |
| Music | 🔵 | Public pages exist; defer to v2. |

---

## Commerce (Priority 3)

| Flow | Status | Notes |
| ---- | ------ | ----- |
| Artwork → checkout → payment → confirmation | 🟡 | Form → PENDING order → toast. Payment missing. |
| Order record | 🟡 | `Order` + `OrderItem` models; legacy `Transaction` for M-Pesa path. |
| Inventory update | ❌ | Not implemented post-payment. |
| Merch variants (size/color/stock) | 🟡 | Schema + read API (`pages/api/products/*`). **No public merch UI.** Checkout backend supports `productVariantId`. |
| Event ticket purchase (public) | ❌ | RSVP only (`pages/api/events/[slug]/rsvp.ts`). No ticket checkout on event page. |
| M-Pesa STK push | 🟡 | Sandbox only. Unauthenticated endpoint. Nesting bug in payment handler. No callback route. |
| Paystack | ❌ | Referenced in schema/orders; zero integration code. |

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
| Sitemap | ❌ | Not implemented. |
| robots.txt | ❌ | Not in `public/`. |

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
