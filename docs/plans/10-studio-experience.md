# Plan 10 — The Studio Experience

**Status:** Complete (2026-07-21)  
**Repo:** `jojjy-gallery-app` (primary); `jojjy-gallery-crm` (content/config, Phase 2+)  
**Effort:** L (2–4 days for Phase A–C); XL for full vision  
**Blocks launch:** No  
**Depends on:** [Plan 09 — Music paid unlock checkout](./09-music-paid-unlock-checkout.md) (commerce baseline)

**Product input:** Ken — MVP commerce is correct; the gap is **emotion and belonging**, not another payment rail.

**Related:** [product-music.md](../product-music.md) · [music-gallery.md](../music-gallery.md) · [music-roadmap.md](../music-roadmap.md)

---

## Thesis

The current music flow is **functionally correct** but **emotionally thin**:

```text
Preview → Pay → Listen
```

Fans are not buying a file. They are entering a relationship with the artist. The product should express:

```text
Discover → Connect → Support → Belong → Collect → Return
```

**Music** and **Studio** are different mindsets:

| Mindset | Intent |
| ------- | ------ |
| **Music** | I want to listen |
| **Studio** | I want to support this artist and be closer to the work |

Plan 09 solved conversion. Plan 10 solves **meaning**.

---

## What we have today (MVP baseline)

| Area | Current | Gap |
| ---- | ------- | --- |
| **Nav** | Single **Music** link | No Studio as a destination |
| **Catalog** | `/music` — releases + `#studio-pass` pricing block | Pass feels like a footer SKU |
| **Pass purchase** | `StudioPassSection` on `/music` + compact on members-only releases | Transactional copy (“Get pass”, “KES/USD price first”) |
| **Members-only release** | “Studio Pass required” + buy buttons | Functional, not intentional exclusivity |
| **Active member** | “Full access” / “Studio Pass active until…” | No celebration, no identity |
| **Library** | Flat list; `librarySource`: PURCHASE \| MEMBERSHIP | No split between **forever** vs **while member** |
| **Checkout** | Redirect to Paystack | No story, no welcome moment |
| **Release notes** | `Release.description` only | No artist notes / studio-only notes |
| **Backend** | `Membership`, `MembershipPlan`, entitlements | Solid — reuse as-is |

**Keep:** compact “Join the Studio” on locked releases (point-of-need conversion).  
**Add:** dedicated **`/music/studio`** as the emotional heart.

---

## Brand & language

Move public copy from **membership / pass** to **Studio** (internal enums stay `MEMBERS_ONLY`, `Membership`, `MEMBERSHIP_PASS`).

| Avoid (public) | Prefer (public) |
| -------------- | ---------------- |
| Membership | The Studio |
| Studio Pass | Join the Studio / Inside the Studio |
| Members Only | Inside the Studio (for now) |
| Purchase | Unlock / Add to your collection |
| Member | Studio Member |

**Working title for the destination page:** **Step Inside the Studio** (hero) · nav label **Studio**.

CRM/admin can keep “Membership plan” until a copy pass is warranted.

---

## Information architecture

```text
Music          →  /music              Listen · browse releases
Studio         →  /music/studio        Support · belong · join
Release        →  /music/[slug]        One work · play · unlock / studio gate
Your Collection → /music/library       Owned forever + studio access (split)
```

Optional later: `/music/studio/welcome` post-checkout (or modal on return).

Remove full pricing section from bottom of `/music` once `/music/studio` ships; replace with a single editorial link:

> **Step inside the Studio →**

---

## The Studio page (`/music/studio`)

Not a pricing page. An **invitation**.

### Section order (never lead with price)

1. **Hero — emotion first**  
   - Headline: *Step Inside the Studio*  
   - Sub: artist-voiced invitation (CRM-editable in Phase B; static seed copy in Phase A)  
   - Primary CTA: **Join the Studio** (scroll to plans or open checkout)  
   - Secondary: *Listen on Music* → `/music`

2. **The relationship — not features**  
   - Copy block: *Studio members experience work while it's still becoming.*  
   - Vertical journey (visual): Early music → Studio journals → Behind-the-scenes → Member releases → Priority events  
   - Phase A: static content; Phase B: CRM-managed bullets

3. **Currently inside the Studio**  
   - Live cards driven from data where possible:  
     - Count of `MEMBERS_ONLY` published releases  
     - Optional CRM “studio highlights” (images, journal links) — Phase B  
   - Example card types: unreleased songs, sketchbook, BTS photos, event priority  
   - Phase A: auto-list member releases + placeholder cards for future content types

4. **The journey — why join**  
   - Timeline diagram:  
     ```text
     Idea → Studio Members → Paid Release → Spotify / YouTube
     ```  
   - One sentence: *You're hearing it at the beginning.*

5. **Join — plans last**  
   - Refactor `StudioPassSection` → **`StudioJoinSection`** on this page only  
   - Plan cards with duration + USD price  
   - Checkout framing: *Support independent art — your contribution funds future music and exhibitions.*  
   - Sign-in gate unchanged

6. **FAQ / trust (short)**  
   - Pass stacking, what happens when it expires, difference vs purchasing a release

---

## Release page — members-only gate (emotional)

Replace functional gate copy on `MEMBERS_ONLY` releases when `viewerAccess.state === membership_required`:

**Instead of**

> Studio Pass required · Get pass · $12

**Use**

> This release is **inside the Studio** right now.  
> Studio members hear every release before it reaches the public.  
> **Join the Studio** · or wait until public release.

- **Join the Studio** → `/music/studio` (or compact inline checkout — keep both)  
- **Wait until public release** — optional soft dismiss; no play (honest expectation)

When `access.state === owned` and user is a **studio member** (not purchase):

> ✓ **Studio Member**  
> You're listening before public release.

When user **purchased** the release (rare for MEMBERS_ONLY, but if unlock exists):

> In your collection forever.

---

## Active member — celebrate, don't just unlock

Surfaces to upgrade:

| Surface | Member state |
| ------- | ------------ |
| Release page | ✓ Studio Member · listening before public release |
| `/music/studio` | Welcome back · active until {date} |
| Navbar (optional Phase C) | subtle “Studio” indicator when active |
| Account (optional) | Studio membership row |

**Phase C — identity (light)**

- Show: *Studio Member · since {month year}*  
- Optional CRM grant label: *Founding Member* (manual flag on `Membership` or first N members)  
- Defer levels (Collector, Patron, Inner Circle) to Phase 2+

---

## Library — split the relationship

Rename framing: **Your Collection** (page title can stay `/music/library`).

```text
Your Collection
Purchased forever
────────────────
[release cards — librarySource: PURCHASE]

Studio Access
Available while you're a Studio member
────────────────
[release cards — librarySource: MEMBERSHIP]
```

Empty states:

- No purchases: *Nothing in your collection yet — unlock a release on Music.*  
- No membership / expired: *Studio access appears here while your Studio membership is active.*

API change (small): return `{ collection: [], studioAccess: [] }` or group client-side from existing `librarySource`.

---

## Checkout & post-purchase — storytelling

### Before Paystack (inline modal or section above redirect)

Short copy on Studio join and release unlock:

> Support independent art.  
> Your purchase funds future music, exhibitions, and stories from the studio.

No change to Paystack amount logic (USD display · KES charge).

### After purchase — welcome moment (Phase B)

Don't only `router.replace` silently.

**Release unlock return**

> Welcome. *{Title}* is yours forever.  
> Added to your collection.  
> [Listen now] [View collection]

**Studio join return**

> Welcome to the Studio.  
> Member releases are unlocked.  
> [Explore inside the Studio] [Your collection]

Implementation options:

- Query flag `?welcomed=1` + modal on release/studio page  
- Dedicated `/music/welcome?type=studio|release&slug=` (Phase B)  
- Cover art subtle scale animation (CSS, respect `prefers-reduced-motion`)

---

## Release notes (Phase C / product extension)

| Field | Visibility | Phase |
| ----- | ---------- | ----- |
| `description` | Public on release page | Exists |
| `artistNotes` | Public — story behind the work | New optional CRM + schema |
| `studioNotes` | Studio members only | New optional CRM + schema |

Members get exclusive context **without** requiring more audio. Playback API already gates; notes API mirrors `viewerAccess`.

---

## Funnel target

```text
Discover     /music, gallery, events
     ↓
Connect      artist story, release notes
     ↓
Support      unlock purchase OR join studio
     ↓
Belong       studio page, member badge, library split
     ↓
Collect      purchases permanent in collection
     ↓
Return       library, email (later), new releases
```

Plan 09 covers **Support** for paid unlock. Plan 10 covers **Belong** and the **Studio** destination.

---

## Implementation phases

### Phase A — Studio destination (ship first)

**Effort:** M–L · **Highest ROI per Ken**

| Task | Detail |
| ---- | ------ |
| New page | `pages/music/studio.tsx` — hero, relationship, journey, join section |
| Nav | Add **Studio** next to Music (or Music dropdown: Listen \| Studio) |
| Component split | `StudioJoinSection` (pricing + checkout) extracted from `StudioPassSection` |
| `/music` slim down | Remove full pass block; add editorial CTA → `/music/studio` |
| Copy pass | Replace “Studio Pass” / “Membership” in gallery UI per brand table |
| Release gate copy | Emotional members-only block + link to `/music/studio` |
| Member celebration | Studio Member line on release + studio page when active |
| Library split | Two sections: Collection vs Studio Access |
| API | `GET /api/music/library` → grouped response (or client group) |

**Acceptance**

- [ ] Fan can discover Studio without seeing price on `/music` first  
- [ ] `/music/studio` tells story before plans  
- [ ] Join flow still completes via Paystack  
- [ ] Members-only release copy feels intentional  
- [ ] Library clearly separates forever vs membership access  

### Phase B — Content & welcome

**Effort:** M · CRM + gallery

| Task | Detail |
| ---- | ------ |
| CRM | Studio page copy fields (hero, invitation, journey bullets) — or single JSON config |
| CRM | “Currently inside” highlights (optional curated list) |
| Gallery | Render CRM copy on `/music/studio` |
| Post-checkout | Welcome modal or `/music/welcome` with type-specific copy |
| Checkout | Support story blurb before redirect |

### Phase C — Identity & notes

**Effort:** M–L

| Task | Detail |
| ---- | ------ |
| Member since | Expose `Membership.startedAt` in viewer API |
| Founding member | Optional CRM flag or computed first-N |
| `artistNotes` / `studioNotes` | Schema + CRM + release page gated section |
| Nav indicator | Subtle Studio Member state in navbar |

### Phase D — Deferred (vision)

- Tier names (Collector, Patron, Inner Circle)  
- Studio journals / non-music exclusive content types  
- Email “new inside the studio”  
- Animations beyond subtle welcome  
- Public release scheduling (“wait until public”) with dated messaging  

---

## Files to touch (Phase A)

| File | Change |
| ---- | ------ |
| `pages/music/studio.tsx` | **New** — Studio destination |
| `components/music/StudioJoinSection.tsx` | **New** — plans + checkout (from `StudioPassSection`) |
| `components/music/StudioPassSection.tsx` | Slim to compact-only for release page OR alias |
| `pages/music/index.tsx` | Remove full section; CTA to studio |
| `pages/music/[slug].tsx` | Emotional gate + member celebration copy |
| `pages/music/library.tsx` | Split collection vs studio access |
| `pages/api/music/library.ts` | Optional grouped payload |
| `components/ui/Navbar.tsx` | Add Studio link |
| `pages/api/music/membership-plans.ts` | Include `startedAt` for member identity (Phase A light) |

---

## What not to change

- Entitlement resolver logic (`MEMBERS_ONLY`, `Membership`, stacking)  
- Order / Paystack / KES-at-payment pipeline  
- CRM manual grants  
- Compact join on locked releases (keep for conversion)  
- Whole-release unlock model (no per-track commerce)

---

## Success metrics (qualitative + light quant)

- Studio page visit → join conversion (vs join only from release gate)  
- Return visits to `/music/library` and `/music/studio` within 30 days  
- Support tickets / confusion: “what is membership?” should drop  
- Artist feedback: does the Studio page feel like *their* invitation?

---

## Recommendation summary

| Ken says | Plan |
| -------- | ---- |
| MVP commerce is correct | Keep Plan 09 flows |
| Lacks emotion | Phase A copy + `/music/studio` |
| Dedicated Studio page | **Yes** — `/music/studio`, not `#studio-pass` on catalog |
| Keep compact join on releases | **Yes** |
| Membership → Studio language | Public copy pass Phase A |
| Library split | Phase A |
| Release notes / tiers | Phase C+ |

**If only one slice ships:** Phase A — **`/music/studio` as destination** + language + library split + release gate copy. That is the single highest-leverage improvement.

---

## Changelog

| Date | Note |
| ---- | ---- |
| 2026-07-21 | Plan created from Ken product review — emotional layer on top of Plan 09 MVP |
