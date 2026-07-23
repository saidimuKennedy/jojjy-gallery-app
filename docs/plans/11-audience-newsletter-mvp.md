# Plan 11 — Audience (Newsletter) MVP

**Status:** Complete (2026-07-23)  
**Repo:** `jojjy-gallery-app` + `jojjy-gallery-crm`  
**Effort:** S (½–1 day with scroll modal)  
**Blocks launch:** No — high ROI polish; starts collecting reach before music / events / announcements mature  
**Depends on:** Shared Prisma schema (already in place). No payment or email-provider work.

**Product input:** Build the shell only. Do not build Mailchimp on day one.

**Related:** [LAUNCH_CHECKLIST.md](../../LAUNCH_CHECKLIST.md) (Subscribers 🟡) · [scope-v1-tickets-merch-crm.md](../scope-v1-tickets-merch-crm.md) (fan notifications) · existing `Subscriber` + `/api/subscribe/follow`

---

## Thesis

The newsletter is **not** an email marketing system.

It is simply:

> A visitor can subscribe to updates from the artist.

Every guest email captured today is someone we can reach when music, events, or new artwork launches. Sending, templates, campaigns, and segments are **explicitly later**.

---

## MVP Goal

| Do | Do not |
| -- | ------ |
| Dedicated public subscribe page (single form surface) | Footer / site-wide inline subscribe section |
| Scroll-triggered modal that routes visitors to that page | Exit-intent, multi-step wizards, A/B tooling |
| Persist subscribers with duplicate protection | Double opt-in / confirmation emails (v1) |
| CRM **Audience** page: list, search, export CSV | Campaigns, templates, scheduling |
| Warm thank-you copy | Open rates, clicks, segments |
| Keep existing logged-in “Follow the artist” working | Wire Announcements → blast (Phase 3) |

---

## What we have today

| Area | Current | Gap |
| ---- | ------- | --- |
| **Schema** | `Subscriber` — `id`, `email?`, `phoneNumber?`, `userId?`, timestamps | No `status`, no unsubscribe timestamps |
| **Public guest UI** | ❌ None | Need dedicated subscribe page + scroll modal CTA (no footer form) |
| **Logged-in follow** | ✅ About + Account → `POST/DELETE/GET /api/subscribe/follow` | Keep; link email subscribers to `userId` when they follow |
| **Guest subscribe API** | ❌ None | Need public `POST` with validation + duplicate handling |
| **CRM** | Announcements CRUD only; no subscriber list | New **Audience** nav + page |
| **Export / search** | ❌ | List + search + CSV |
| **Sending** | SendGrid dep unused for blasts; `Announcement.emailSentAt` unused | Out of scope this sprint |

---

## Naming (CRM)

Call the module **Audience**, not Newsletter.

Today it only contains **Subscribers**. Later it grows into:

```text
Audience
  ├── Subscribers
  ├── Members        (Studio / memberships)
  ├── Customers      (orders)
  └── Event Attendees
```

Nav placement (CRM): after Announcements (or beside it) — still a fan-facing concern, not Staff.

---

## Public Gallery — dedicated subscribe page

**Decision:** Do **not** put the subscribe form in the Footer. One intentional destination owns capture.

### Route

**`/subscribe`** (working title; public copy can still lead with “Stay Close to the Work”).

Optional later aliases (`/updates`, `/stay-close`) are redirects only — one canonical URL.

### Page composition (one job)

```text
Stay Close to the Work

Receive occasional updates about
new artworks, music releases,
exhibitions and studio news.

[ Email Address            ]

                [ Subscribe ]

No spam. Unsubscribe anytime.
```

**Rules**

- One email field. One button. No preferences.
- This page is the **only** place the email form lives in MVP.
- Success state (not a bare “Success”):

```text
Thanks for joining.

You'll be the first to hear about
new artworks,
studio releases,
and upcoming exhibitions.
```

- Match existing gallery typography / spacing (`font-display`, light tracking, restrained neutrals). Full page, not a footer strip; treat it as a quiet destination (hero-level brand + one ask), not a dashboard.
- Existing site Footer stays brand / Instagram / Contact only — **no** newsletter block.
- Optional: a single text link in the Footer or nav (“Updates” / “Subscribe”) pointing to `/subscribe` — link only, no form.

**Suggested files**

- `pages/subscribe.tsx` — dedicated page
- `components/ui/NewsletterSignup.tsx` (or `AudienceSignup.tsx`) — form used **only** on this page
- `components/ui/NewsletterModal.tsx` — scroll-triggered soft ask (see below)
- Mount modal once from `pages/_app.tsx` (or `AudienceCapture`) so it works on every public page except `/subscribe` itself and excluded routes

---

## Public Gallery — scroll modal (visitor capture)

The dedicated page is the form. The modal is a **soft CTA** for visitors who are engaged but not yet subscribed — it sends them to `/subscribe` or they dismiss.

### Intent

```text
Visitor lands on any public page (not /subscribe)
  → Reads / scrolls (~near end of page)
  → Modal appears once (per cooldown rules)
  → Go to /subscribe  ·  or dismiss
```

Audience: **not yet subscribed** visitors. Already-subscribed (local flag) and recently dismissed visitors never see it again until rules say so.

### Trigger

| Rule | Value |
| ---- | ----- |
| Scroll depth | Fire when scroll position ≥ **~80%** of document height |
| Delay floor | Optional **8–12s** on page before eligible (avoids instant pop on short pages) |
| Once per session | After show or dismiss, do not re-open on route changes until cooldown expires |
| Short pages | If content is shorter than viewport, use delay-only (e.g. after 12s) — do not spam on load |
| Never on | `/subscribe` (they are already on the form), `/login`, `/register`, `/account/*`, checkout/confirmation |

### Who sees it

Show only when **all** are true:

1. Route is eligible (see above)
2. `localStorage` has **no** `jojjy.audience.subscribed = "1"`
3. Dismiss cooldown expired: no `jojjy.audience.modalDismissedAt` within **14 days** (tunable)
4. Optional: skip if logged-in user already “following” (call existing follow GET once) — nice-to-have, not required for v1

After a successful subscribe on `/subscribe`, set `jojjy.audience.subscribed = "1"` so the modal never nags them again.

### Modal content & actions

Same headline family as the page (“Stay Close to the Work”), short supporting line, no email field in the modal (keeps one form surface). Visual language like `MusicWelcomeModal` — quiet, not a promo sticker.

| Action | Behavior |
| ------ | -------- |
| **Subscribe** / **Stay close** (primary) | Navigate to `/subscribe` (and close modal). Form lives only on that page. |
| **Dismiss** (X / Esc / backdrop / “Not now”) | Close; write `jojjy.audience.modalDismissedAt = Date.now()`; honor 14-day cooldown |

**Do not** embed the email field in the modal in MVP — that would duplicate the dedicated page and fight the “one destination” rule. If conversion data later demands an inline modal form, treat it as a deliberate Phase 2 experiment.

### Accessibility & UX

- `role="dialog"` · `aria-modal="true"` · focus trap · Esc closes
- Do not steal focus until the modal actually opens
- Respect `prefers-reduced-motion` for entrance
- Mobile: full-width panel, thumb-friendly dismiss; exclude confirmation / payment pages

### Suggested implementation sketch

```text
AudienceCapture (client, in _app)
  ├── reads localStorage flags
  ├── scroll listener (passive) → setOpen(true) once eligible
  ├── NewsletterModal
  │     ├── primary → router.push("/subscribe")
  │     └── dismiss → cooldown flag
  └── /subscribe page
        └── NewsletterSignup → onSuccess → subscribed flag
```

### Effort impact

Dedicated page + modal CTA is still an **S** sprint. Page owns the form; modal is a thin prompt. **Do not** ship the modal without dismiss cooldown.

---

## Schema

Keep the table tiny. **Extend** the existing `Subscriber` model (do not replace it — follow-the-artist and `userId` / `phoneNumber` stay).

### Target shape

```prisma
enum SubscriberStatus {
  ACTIVE
  UNSUBSCRIBED
}

model Subscriber {
  id             String           @id @default(uuid())
  email          String?          @unique
  phoneNumber    String?          @unique
  userId         String?          @unique
  status         SubscriberStatus @default(ACTIVE)
  subscribedAt   DateTime         @default(now())
  confirmedAt    DateTime?        // reserved for Phase 2 double opt-in; null in MVP
  unsubscribedAt DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  user           User?            @relation(...)

  @@index([status])
  @@index([email])
  @@map("subscribers")
}
```

### Migration notes

- Backfill: existing rows → `status = ACTIVE`, `subscribedAt = createdAt` (or copy `createdAt` in SQL).
- `confirmedAt` stays null in MVP (no confirmation email).
- Guest subscribe requires a non-null `email`. Existing rows may still have email-less follow-only records (`userId` only) — CRM list should prefer rows with email; follow API behavior unchanged.
- Duplicate email: `@unique` on `email` + application-level upsert / friendly “already subscribed” response.

**Out of schema this sprint:** tags, lists, segments, source channel, UTM fields.

---

## Workflow (guest)

```text
Visitor
  → Enter email
  → Validate (format, required)
  → Save (ACTIVE; duplicate → soft success)
  → Thank you
```

Done. No email sent.

### Duplicate policy

| Case | Behavior |
| ---- | -------- |
| New email | Create `ACTIVE` subscriber |
| Same email, `ACTIVE` | Return 200 + same thank-you (do not leak “already on list” harshly; optional quiet message) |
| Same email, `UNSUBSCRIBED` | Re-activate: `status = ACTIVE`, clear `unsubscribedAt`, refresh `subscribedAt` |
| Email linked to another `userId` | Still allow guest row semantics via unique email — follow flow already handles link conflicts |

### API (Gallery)

| Method | Path | Auth | Role |
| ------ | ---- | ---- | ---- |
| `POST` | `/api/subscribe` | Public | Create / re-activate by email |
| existing | `/api/subscribe/follow` | Session | Unchanged |

`POST /api/subscribe` body: `{ email: string }`.  
Validate, normalize (`trim` + lowercase), persist, return success payload for the warm UI.

**Hardening (cheap, include if time):** basic rate limit or honeypot; no CAPTCHA required for MVP unless abuse appears.

---

## CRM MVP — Audience

One page. No sending UI.

```text
Audience / Subscribers

──────────────────
1,203 Subscribers
Search...
──────────────────
john@gmail.com
mary@gmail.com
…
──────────────────
[ Export CSV ]
```

### Capabilities

| Feature | Detail |
| ------- | ------ |
| Total count | `ACTIVE` with email (decide: count all ACTIVE vs email-only — **prefer email-only** for the headline number) |
| List | Email + subscribed date; optionally status badge |
| Search | Client or server filter on email (`contains`, case-insensitive) |
| Export CSV | `email,status,subscribedAt,unsubscribedAt` for current filter (or all ACTIVE) |

### Suggested files (CRM)

- Nav: `components/DashboardLayout.tsx` — add **Audience** → `/dashboard/audience`
- Page: `pages/dashboard/audience.tsx`
- API: `GET /api/subscribers?q=` · `GET /api/subscribers/export` (or `?format=csv`)
- Permission: reuse `announcements:read` for v1 **or** add `audience:read` in seed — prefer **reuse announcements:read** this sprint to avoid permission migration churn; revisit when Audience grows.

### Dashboard overview card

Optional one-liner on CRM Overview (`pages/dashboard/index.tsx`): “Audience — subscribers” linking to the new page.

---

## Sprint checklist (timebox: ~½–1 day with modal)

- [x] Extend `Subscriber` with `status`, `subscribedAt`, `confirmedAt`, `unsubscribedAt` + migration / backfill
- [x] `POST /api/subscribe` on Gallery (validate, normalize, duplicate / re-activate)
- [x] Dedicated `/subscribe` page + `NewsletterSignup` form + warm thank-you
- [x] Optional Footer/nav text link to `/subscribe` (no form in Footer)
- [x] Scroll-triggered `NewsletterModal` → primary CTA to `/subscribe` (exclude `/subscribe`, auth, checkout)
- [x] localStorage: subscribed flag + dismiss cooldown (14 days)
- [x] CRM **Audience** nav + subscribers list + search
- [x] CSV export
- [x] Smoke: scroll → modal → `/subscribe` → subscribe → CRM; dismiss → no re-show; already-subscribed → no modal
- [x] Regression: logged-in Follow on About / Account still works

**Then stop.**

---

## Explicitly out of scope (this sprint)

- Sending email (SendGrid blasts)
- Templates, campaigns, scheduling
- Audience segments / tags / lists
- Double opt-in / confirmation mail
- Unsubscribe landing page + signed token (schema field only for now)
- Announcement → “Notify subscribers”
- Preference center
- WhatsApp subscribe UI (phone field already exists; leave unused for guest MVP)
- Footer (or site-wide) inline newsletter form
- Email field inside the scroll modal (page-only form in MVP)
- Exit-intent popups or multi-page drip
- Server-side “already subscribed” detection for anonymous visitors (localStorage is enough for MVP)

---

## Phase 2 (after launch)

Only once collecting works in production:

```text
Email Campaigns
  → Templates
  → Scheduling
  → Audience Segments
  → Open Rate
  → Clicks
```

Also: confirmation email (`confirmedAt`), public unsubscribe link writing `UNSUBSCRIBED` + `unsubscribedAt`.

---

## Phase 3 (even later)

Integrate Announcements so one publish can notify:

```text
Announcement → Publish → Notify Subscribers
```

One action, two outputs (on-site + email). Reuse `Announcement.emailSentAt`. Do **not** start this until Audience list + export are trusted and a real send path exists.

---

## Success criteria

1. A visitor can subscribe only via the dedicated `/subscribe` page (email form nowhere else in MVP).
2. A visitor who scrolls near the end of a public page sees the modal once and can go to `/subscribe` or dismiss.
3. Dismiss or successful subscribe stops the modal from nagging (cooldown / subscribed flag).
4. Duplicate submits do not create a second row or crash.
5. Artist opens CRM → **Audience** → sees count, can search, can download CSV.
6. No campaign or send UI shipped; no newsletter form in the Footer.
7. Existing Follow-the-artist flow still works for logged-in users.

---

## Effort split (suggested)

| Slice | Repo | ~Time |
| ----- | ---- | ----- |
| Schema + migrate | Gallery (canonical Prisma) | 30–45 min |
| Public API + `/subscribe` page + form | Gallery | 1–1.5 h |
| Scroll modal → `/subscribe` + localStorage | Gallery | 1 h |
| CRM list / search / CSV | CRM | 1–1.5 h |
| Buffer / polish / smoke | Both | 30 min |
