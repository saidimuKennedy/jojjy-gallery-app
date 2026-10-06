# JENGA Artist Platform — Launch Blockers & Decisions Log

**Purpose:** The running register of every blocker encountered and every
decision taken while executing launch Batches 0–5. Updated as each batch runs.
Status legend: `OPEN` (needs action before launch) · `DECIDED` (resolved in
batch) · `EXTERNAL` (needs client/access/capability outside engineering) ·
`DEFERRED` (post-V1 backlog).

> Working notes: no secret values are recorded here — only variable *names*,
> tiers (test/live), and targets. No commit/push was performed by any batch.

---

## 1. OPEN blockers (must clear before go-live)

| # | Blocker | Found in | Owner / action needed |
|---|---|---|---|
| B1 | Production database `_prisma_migrations` state unverified. Local dev DB is at the reviewed level, but no session ever reached the VPS/production Postgres. | Batch 0, open since | Deploy operator: run `SELECT migration_name FROM _prisma_migrations ORDER BY finished_at;` against production before first deploy; confirm both `20260829130000_add_event_publish_at` and `20261005000000_add_media_blog_published_at` are absent-or-applied exactly once. |
| B2 | Three migration directories are untracked in git (two pairs) and therefore missing from any fresh-clone image build: public-app `20260829130000_add_event_publish_at/` (= CRM's copy, byte-identical) and `20261005000000_add_media_blog_published_at/` in both repos (byte-identical pair). A deploy from a clean clone would apply publishAt content via the CRM history only, diverging the app's history from the DB. | Batch 0, extended Batch 1 | Committer with push rights: `git add` + commit the three directories with their current content (each pair verified byte-identical across repos; the two pairs differ from each other). Do NOT rename, regenerate, or edit the SQL. |
| B3 | No interactive Paystack test charge has completed end-to-end (init → authorize → callback → verify → webhook → PAID + fulfilment + email). All layers around it are proven, but PAID itself is not. | Batch 3, open since | Operator with Paystack test access: run one test-card purchase per advertised type (merch, ticket, artwork) in the target deployment. |
| B4 | `RESEND_API_KEY` unset everywhere (local `.env`, deploy example blank). Order-confirmation and contact emails cannot send; contact degrades to a truthful 500, order mail is silently skipped. | Batch 1/3, open since | Client/operator: supply key + verify `EMAIL_FROM` sender + approve `CONTACT_FORM_RECIPIENT_EMAIL`. Re-test both paths. |
| B5 | No real launch content seeded anywhere reachable: dev DB content tables are empty (0 products/events/releases/editorial). Staff login was proven only with throwaway dev accounts (since removed). | Batch 2/4, open since | Content owner + CRM operator: seed real catalogue via CRM in staging/production; provision operator accounts via documented seed env vars, then rotate/remove them. |
| B6 | Production domains, TLS, and public reachability unproven from here (no VPS access; `deploy/.env` secrets unset; Paystack webhook/callback URLs not registered). | Batch 0, open since | Deploy operator: run `deploy/deploy.sh` on the VPS, register `https://$APP_DOMAIN/api/paystack/webhook` in Paystack. |
| B7 | No browser/mobile/keyboard verification performed in any batch (no browser tooling in this environment). Reduced-motion, focus visibility, and small-screen layout are code-inspected only. | Batch 1–4, open since | Reviewer with a device lab: walk the Batch 4 smoke list on mobile + keyboard-only before sign-off. |

## 2. EXTERNAL dependencies (client / access / capability)

| # | Dependency | Needed by | Notes |
|---|---|---|---|
| E1 | Final hero video (or sign-off on portrait-only hero) | Batch 4 / launch | Batch 1 removed Cloudinary *sample* footage; hero now rests on the genuine artist portrait. |
| E2 | Artist Instagram profile URL + WhatsApp number (or explicit "omit") | Launch | Both degrade gracefully when unset (`NEXT_PUBLIC_ARTIST_INSTAGRAM_URL`, `NEXT_PUBLIC_ARTIST_WHATSAPP_NUMBER` documented in `.env.example` + audit manifest). Do not invent values. |
| E3 | Launch-sold categories decision (merch? tickets? original art? paid releases?) | Batch 3 asked, still open | Code supports all four through one checkout; scope assumption says merch/tickets/artwork only where verified. Paid-release unlock UI renders only when CRM sets a release PAID. |
| E4 | Accounts-required-to-buy policy confirmation | Batch 1 asked, still open | Checkout APIs require sign-in; no guest checkout exists (out of scope). If policy demands guest buying, that is new scope, not a bug. |
| E5 | `KES_PER_USD` rate ownership | Launch ops | Code default 130 applies when unset; operator should set and periodically review the rate used for USD→KES charge conversion. |
| E6 | Operator runbook contact/rollback owner + dates | Batch 4 exit | Named in §6 runbook below; fill in names/dates before go-live. |

## 3. Decisions taken (with rationale)

### Batch 0 — Release baseline
- D1 (DECIDED): Docker/Caddy VPS deployment is authoritative; Vercel references are aspirational. Evidence: executable `deploy.sh` + compose + Dockerfiles + `docs/deploy-docker.md` vs checklist prose with no `vercel.json`; `next build` needs live DB unreachable from Vercel.
- D2 (DECIDED): Public app owns the shared migration history; CRM adds only staff-auth (plus byte-identical mirrors of shared migrations). Evidence: compose comments + sequential `migrate-app` → `migrate-crm` in `deploy.sh`. Proven live in Batch 1 (app deploy applied the shared migration; CRM deploy no-op'd).
- D3 (DECIDED): Event write-on-read promotion retained for V1 (idempotent, CANCELLED-exempt, endsAt-null-exempt; write failure degrades to section fallback/500 — accepted).
- D4 (DECIDED): Payment path READY FOR CONTROLLED SMOKE TEST (code-complete; currency check was the one gap → fixed Batch 1).
- D5 (DECIDED): No commit/push from any batch; dirty pre-existing work preserved verbatim.

### Batch 1 — Visitor journeys
- D6 (DECIDED): Homepage `TakeSomething` uses the derived `upcomingEvent`, unifying the homepage event rule.
- D7 (DECIDED): Sitemap and checkout reuse canonical promotion logic instead of duplicating predicates.
- D8 (DECIDED): `MediaBlogEntry.publishedAt` (null = draft) added to both schemas with mirrored migration + backfill `publishedAt = createdAt`; public predicate is `publishedAt <= now`. Rationale: zero prior publication state; backfill keeps existing content live.
- D9 (DECIDED): Primary nav is Art/Music/Events/Studio/Shop/About/Contact; `/music/studio` demoted to contextual; routes unchanged.
- D10 (DECIDED): Missing social/WhatsApp config hides the CTA rather than linking fakes. Homepage hides (not fabricates) the studio strip when editorial is empty.
- D11 (DECIDED): No test framework introduced (none existed); verification is scripted + documented manual.

### Batch 2 — CRM readiness
- D12 (DECIDED): `Order.currency` default divergence (USD app vs KES CRM) left as-is — inert because CRM never creates orders; changing it would add migrate-diff noise for zero effect.
- D13 (DECIDED): `Release.artistNotes/studioNotes` added to the CRM schema with **no** migration file (columns already exist in DB via the app-owned studio-experience migration; CRM-schema-only addition matches the existing pattern).
- D14 (DECIDED): Validation hardening over new features — 400s for bad prices/stock/windows/SKUs/film hosts; 409s for deletes/replaces touching order history; no per-user permission editor, no role editor, no subscriber mutations (not V1-required).
- D15 (DECIDED): Series/Event/Artwork secondary media (SeriesMediaFile, EventMediaFile, PressMention) stay unauthorable — deferred tooling per plan unless real launch content needs it.
- D16 (DECIDED): Deactivation revokes API access immediately via per-request `isActive` re-check (JWT permission snapshot retained for scale; accepted residual: permission *changes* propagate at re-login).

### Batch 3 — Commerce & email
- D17 (DECIDED): Test-tier keypair confirmed safe for verification; no live keys touched. Full charge completion deferred to operator-run test (B3).
- D18 (DECIDED): Webhook acknowledges unknown references with 200 (no retry storm); genuine fulfilment failures still 500 for Paystack retry.
- D19 (DECIDED): Confirmation page shows fulfilment method (it was collected but invisible).
- D20 (DECIDED): Email stays best-effort + truthful-degradation; no campaign machinery (B4).

### Batch 4 — Verification (running)
- D21 (DECIDED): Release candidate is defined as exact revisions + dirty inventory below (§5), not a tag — nothing is committed or deployed by this batch.
- D22 (DECIDED): `ticketPerks()` hardcoded VIP benefits ("Priority entry / Artist meet & greet / Signed exhibition card") removed and replaced with neutral copy. Rationale: scope-leak audit proved they invent fulfilment promises no CRM data supports; specific perks need CRM-managed data (deferred tooling) before being advertised.
- D23 (DECIDED): Accepted a11y hardening applied without redesign — mobile menu gets `role=dialog`/`aria-modal`/`aria-expanded`/`aria-controls`, Esc-to-close, and `hidden` when closed (unfocused background no longer reachable); shop purchase controls get associated labels; contact/login/register errors get `role=alert`/`status`; event hero image uses the event title as alt. Residual (documented, device-check pending): no focus-trap/return-focus in the menu, gallery audio/thumbnail alts.
- D24 (DECIDED): Release builds must be clean builds (`rm -rf .next`). Evidence: an incremental rebuild silently served pre-fix prerendered HTML (stale labels observed in served output despite green build + correct sources); clean rebuild resolved it. Release procedure updated in §6.
- D25 (DECIDED): `next start` survivors cannot be signalled from this environment (no kill/pkill); verification used fresh ports per build (3002/3004/3005, CRM 3102). Operational note only — irrelevant on the VPS.
- D26 (DECIDED): Client-rendered states (shop selectors, conditional alerts) verified at source + type level; only server-rendered markup was asserted over HTTP. Browser assertion of interactive states stays in B7.

## 4. DEFERRED (post-V1, Batch 5 backlog pointer)
Paid-music/membership productization · announcement email/WhatsApp delivery ·
CRM analytics · ticket check-in · press/series-media authoring · guest checkout
and cart · refunds automation · subscriber management UI · role/permission
editors · brute-force lockout/CAPTCHA · systematic test framework. Full
triage in §7.

## 5. Release-candidate definition (Batch 4, final)
- Public app revision: `a75bf2b` + 33 modified files + 4 untracked (`docs/launch-execution-plan.md`, `docs/launch-blockers-and-decisions.md`, `prisma/migrations/20260829130000_add_event_publish_at/`, `prisma/migrations/20261005000000_add_media_blog_published_at/`). Review added one modified file (`lib/orders/fulfill.ts`, atomic fulfilment guards); no schema/migration change.
- CRM revision: `143bb41` + 28 modified files + 2 untracked (`lib/validate-variants.ts`, `prisma/migrations/20261005000000_add_media_blog_published_at/`). Review changed one file (cancel-confirm copy); no schema/migration change.
- Provenance: `npx tsc --noEmit` clean both repos; `prisma validate` both; **clean** `npm run build` green both repos; ordered `migrate deploy` (app→CRM) verified on dev DB with `migrate status` up-to-date both.
- Smoke: 25/25 public checks + 14/14 CRM checks on `next start` prod builds; editorial draft→publish→delete cycle re-proven publicly; sitemap slugs == public event API slugs.

## 6. Operator runbook (fill owners/dates before go-live)
1. Commit the B2 directories (byte-identical, no edits), push both repos at the revisions in §5.
2. Provision VPS → clone → `cp deploy/.env.example deploy/.env`, fill secrets (incl. Resend key, sender, recipient; Paystack **live** keys only when ready to sell) → `rm -rf` stale images → `./deploy/deploy.sh` (db → migrate-app → migrate-crm → **clean** build → up).
3. Verify: `docker compose ps`; `SELECT migration_name FROM _prisma_migrations;`; hit `/`, `/events`, `/sitemap.xml`; complete one live (or test-mode) purchase; check order PAID + mail logs.
4. Rollback: `docker compose down`; restore DB from the pre-migration backup (take one before step 2); previous image tags via `docker images`.
5. Contacts: deploy owner ___ · content owner ___ · Paystack/Resend owner ___ · date ___.

## 7. Go / no-go (Batch 4 evidence)

| Capability | Verdict | Evidence |
|---|---|---|
| Public journeys (all V1 routes, empty + error + draft states) | GO | 25/25 prod-build checks; sitemap == API |
| CRM authoring + publish/unpublish | GO | 14/14 prod-build checks incl. public effect |
| Commerce to Paystack init + failure safety + idempotency | GO with condition | Batch 3 proofs; live charge still B3 |
| Email (contact + order) | NO-GO | B4 — key missing; degradation verified only |
| Production deploy + domains + TLS + webhooks | NO-GO | B1, B6 — never reached from here |
| Content/operators (real catalogue, staff accounts) | NO-GO | B5 — dev DB nearly empty of launch content |
| Browser/mobile/keyboard device pass | NO-GO | B7 — code-level only |
| **Overall launch** | **NO-GO** | Engineering complete; B1–B6 are operational/external and must clear first |

## 8. Batch 5 backlog triage (no implementation — scope sketches only)

| Item | Trigger to prioritize | Acceptance sketch |
|---|---|---|
| Paid music unlocks + Studio membership productization | Evidence that free discovery converts / artist offers memberships | Plans purchasable via existing checkout; entitlements + member-gating proven end-to-end; member content seeded |
| Announcement delivery (Resend/WhatsApp) | Subscriber base + editorial cadence exist | Consent + unsubscribe tracked; delivery status visible in CRM; sends via approved sender only |
| CRM analytics | Traffic justifies it | Page/event views aggregated without exposing PII; no visitor-facing claims until live |
| Ticket check-in | First ticketed event scheduled | `tickets:write`-gated scan flow; double-scan refused; works offline-tolerant at the door |
| Press mentions + series media authoring | Real launch content needs them | CRM CRUD wired to existing public renderers; validation mirrors artwork-media rules |
| Guest checkout / cart | Policy decision overturns accounts-required (E4) | New scope: identity, fraud, and fulfilment rules required — not a tweak |
| Subscriber management UI | Abuse/support load | Staff add/remove/suppress without DB; audit-logged |
| Role/permission editors | Operator count grows | Per-user grant/revoke UI matching the (currently dead) override model |
| Login hardening (rate-limit/lockout) | Any brute-force signal | Attempt throttling + logging; no UX change for legitimate staff |
| Systematic test framework | Second engineer onboards | Port the /tmp smoke scripts (B2–B4) into a runner; browser pass for interactive states |

*Batch 5 starts only after V1 is stable or product evidence elevates an item.
Each needs a fresh scope before any code.*
