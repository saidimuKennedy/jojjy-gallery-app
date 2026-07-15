# Product Vision & Roadmap

Status: consultant feedback received and triaged (2026-07-12); "Phase 2"
was originally scoped as a later phase but the client asked for it to be
addressed now, not deferred — it is folded into v1 as of 2026-07-12. This
doc captures the full feedback for reference and records what's in v1 now
and what's still parked as long-term direction.

## The core reframe

An outside party reviewing the plan in `scope-v1-tickets-merch-crm.md`
pushed back on the framing: this isn't one product (an online gallery), it's
three — a digital exhibition, an e-commerce store, and a studio operating
system (CRM) — and they should feel like one ecosystem while staying
clearly separated (which matches the CRM-as-separate-app decision already
made).

The organizing question they proposed for every feature going forward:
**does this deepen the visitor's relationship with the artist?** If not, it
probably doesn't belong on the public site.

The visitor journey they'd rather see:

```
Discover → Become curious → Learn → Connect → Collect → Return
```

...instead of the current implicit `Homepage → Browse → Buy`. Buying is
close to the last step, not the point of entry. Restated as a progression
ladder for prioritization: **Visitor → Follower → Fan → Collector →
Patron** — every feature should make it easier to move someone one step
along that ladder.

## Folded into v1 now (2026-07-12)

Small, additive, no new subsystem — implemented or scoped alongside the
existing ticketing/merch/CRM work:

1. **Artwork status beyond price** — done, including UI wiring (2026-07-12).
   `ArtworkStatus` enum (`AVAILABLE`, `RESERVED`, `ON_EXHIBITION`, `SOLD`,
   `IN_PRIVATE_COLLECTION`) and `status` field on `Artwork`
   (migration `20260712010000_add_artwork_status`). Wired end to end:
   - CRM artwork form (`jojjy-gallery-crm` ArtworkManagement) has a status
     dropdown alongside the existing `isAvailable` checkbox, and the
     gallery card badge now shows the status label instead of a hardcoded
     "SOLD".
   - CRM `pages/api/artworks/index.ts` and `[id].ts` accept/persist
     `status` on create/update.
   - `pages/api/artworks/index.ts` (public listing) accepts a `status`
     query filter.
   - `pages/api/payment/checkout.ts` now requires `status: "AVAILABLE"` in
     addition to the existing `isAvailable: true` check before allowing
     purchase.
   - `pages/artworks/[id].tsx` shows the status label and only offers the
     buy button when `status === "AVAILABLE"`.
   - `types/api.ts`: `reservedUntil` is converted to an ISO string like the
     other date fields; `reservedByUserId` is deliberately stripped in
     `convertPrismaArtworkToAPI` before the artwork reaches any API
     response — it would otherwise leak another user's id to any visitor
     viewing a reserved artwork.
   - The existing `isAvailable` boolean is untouched everywhere (kept for
     backward compatibility); the two fields are checked together at
     checkout rather than one replacing the other. Deciding whether
     `isAvailable` becomes fully derived from `status` (or is retired) is
     still open — not resolved by this pass.
2. **WhatsApp "Ask about this artwork" deep-link** — done (2026-07-12).
   `pages/artworks/[id].tsx` builds a
   `wa.me/<number>?text=I'm interested in "{title}"` link via
   `NEXT_PUBLIC_ARTIST_WHATSAPP_NUMBER`. The link renders only when that
   env var is set — it's a no-op until the client's WhatsApp Business
   number (already requested, see WhatsApp decision above) is available.
   Confirmed this needs **no** Jiaminie integration — `wa.me` links require
   no API, just the number.
3. **Artwork story field** — no schema change needed; the existing
   `Artwork.description` field is reframed as the "story" copy slot
   ("Created during... / Inspired by...") rather than a generic
   description. Admin UI copy/label update only.
4. **Nav/IA separation: Artworks / Print Editions / Studio Shop** —
   decision recorded: original artworks, print editions, and merch must
   never appear mixed in the same grid/section once merch ships. This
   constrains the merch UI work already planned in
   `scope-v1-tickets-merch-crm.md` — implement as three distinct
   sections/nav entries, not one unified "shop" grid.

## Phase 2 — folded into v1 (schema done, 2026-07-12)

Originally scoped as post-v1; client asked for it to be addressed now.
Schema additions are in `prisma/schema.prisma`
(migration `20260712020000_phase2_fan_collections_events_delivery`),
hand-written and verified against a throwaway local Postgres with zero
drift, same as the rest of the v1 schema — **not yet applied to the real
database**.

- **Collections as exhibition pages** — done end to end on the public site
  (2026-07-12). Schema: `Series.introduction` / `artistStatement` /
  `filmUrl` + `SeriesMediaFile`. Application:
  - `types/api.ts`: `SeriesMediaFile` + converter; series detail includes
    ordered `mediaFiles`.
  - `pages/api/series/[slug].ts` returns artworks + mediaFiles.
  - `pages/portfolio/[seriesName]/index.tsx` rewritten as an exhibition
    journey: intro (or description fallback) → artist statement → works →
    behind-the-scenes → film embed (YouTube/Vimeo) → collect CTAs; driven
    by `useSeries(slug)`.
  - CRM `SeriesManagement` + `/api/series` accept the three
    exhibition text fields. Series media upload UI skipped for now (optional).
  **Still open / CRM:** richer authoring (media upload) lives in the CRM
  sibling app when that lands.
- **Reserve-before-buy** — done end to end (2026-07-12). Schema:
  `Artwork.reservedUntil` / `reservedByUserId` alongside
  `ArtworkStatus.RESERVED`. Application:
  - `lib/reservations.ts` lazily releases expired holds (no cron runner in
    this repo) from artwork list/detail and checkout.
  - `POST`/`DELETE` `pages/api/artworks/[id]/reserve.ts` — auth required;
    atomic `updateMany` claim (409 on race); cancel allowed for the holder
    or an admin.
  - Public APIs return `reservedByCurrentUser` without exposing
    `reservedByUserId`.
  - `pages/artworks/[id].tsx`: "Reserve for 24 hours", remaining-time + buy
    when you hold the reservation, cancel affordance; logged-out visitors
    are sent to `/login?callbackUrl=…` (same pattern as cart checkout).
  - Checkout already allows the reserving buyer to complete payment while
    status is `RESERVED`.
  **Still open:** a dedicated scheduled expiry job if lazy sweeps prove
  insufficient; whether anonymous visitors should see a hidden Reserve
  button instead of a login redirect (current choice follows CartDrawer).
- **Fan/supporter accounts** — done on the public site (2026-07-12). Schema:
  `WishlistItem`, `EventRsvp`, `Subscriber.userId`. Application:
  - `GET /api/wishlist`, `POST`/`DELETE /api/wishlist/[artworkId]`.
  - `GET`/`POST`/`DELETE /api/subscribe/follow` — links or creates a
    `Subscriber` with `userId` for logged-in follow.
  - `pages/account/index.tsx` — wishlist, follow toggle, purchase history
    from legacy `Transaction` (`/api/account/purchases`).
  - Wishlist toggle on artwork detail (next to WhatsApp); Follow CTA on
    About; Account link in Navbar when logged in.
- **Richer event pages** — done on the public site (2026-07-12). Schema:
  `Event.directions` / `openingHours` / `artistTalkAt`, `EventMediaFile`,
  `PressMention`, `EventRsvp`. Application:
  - `GET /api/events` (PUBLISHED + COMPLETED), `GET /api/events/[slug]`
    (detail + ticketTypes/media/press + session RSVP), `POST`/`DELETE`
    `/api/events/[slug]/rsvp`.
  - `pages/events/index.tsx` + `[slug].tsx` with pre-event (tickets + RSVP)
    and post-event (media + press archive) states. Events in Navbar.
  **Still open / CRM:** event authoring screens live in the CRM sibling.
- **Delivery/logistics** — public merch checkout wired (2026-07-12). Schema
  fields on `Order`: `deliveryMethod`, `deliveryAddress`, `packaging`,
  `deliveryFee`. Application:
  - `GET /api/products`, `GET /api/products/[slug]`.
  - `pages/shop/index.tsx` + `[slug].tsx` with delivery method selector.
  - `POST /api/orders/checkout` — auth; creates PENDING `Order` +
    `OrderItem` (PRODUCT or TICKET, XOR ids); payment stubbed (Paystack
    wiring next). Legacy artwork `Transaction`/M-Pesa checkout untouched.
  - Nav: "Studio Shop" → `/shop`.
  **Open gap (unchanged):** legacy artwork `Transaction` still has no
  delivery fields — original artwork shipping (framed vs rolled) needs a
  later decision: migrate onto `Order`, or duplicate fields onto
  `Transaction`.
- **CRM as a briefing tool, not just CRUD** — no schema change needed;
  this is a CRM-app UX decision (a dashboard view computed from existing
  Order/Ticket/Product/Event data — sales overnight, low merch stock,
  exhibition countdown, pending announcement drafts). Sibling repo
  `jojjy-gallery-crm` is scaffolded (staff auth, dashboard shell, Staff
  permissions overview, content CRUD for artworks/series/media-blog/
  events/tickets/merch/announcements). Gallery admin UI/APIs are retired.
  Briefing dashboard (overnight sales, low stock, etc.) still to build.

## Long-term vision — parked, not designed into v1 schema

Real strategic directions, but the wrong scale of commitment for the
current build. Revisit only after v1 and Phase 2 prove out.

- **Collector CRM** — track preferred medium/series, purchase history,
  events attended, enquiries; auto-notify past buyers of a medium when new
  matching work appears.
- **Provenance** — certificates, edition numbers, purchase/exhibition/
  publication history per artwork.
- **Career timeline** — a visual year-by-year history component on the
  artist page (exhibitions, residencies, awards, releases).
- **White-label "Studio OS"** — the underlying idea that this same engine
  (site + CRM + ticketing + merch + collector management + newsletter +
  payments + media archive) could serve other artists under different
  branding. Not an architecture decision to make now — v1 is being built
  single-tenant for this client; revisit multi-tenancy only if this
  direction is actually pursued.
