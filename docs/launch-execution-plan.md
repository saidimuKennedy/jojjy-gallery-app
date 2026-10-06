# JENGA Artist Platform — Launch Execution Plan

**Purpose:** One ordered plan for taking the existing public site and CRM from inherited code to a coherent V1 launch. This plan is based on the product inventory and the Batch 0 release-baseline brief. It is an execution guide, not authorization to start every batch at once.

**V1 scope assumption:** Homepage; art/portfolio/series; Studio/Journal editorial archive; free music discovery/playback; events; selected original-art, merch, or ticket commerce only where content and payment are verified; newsletter capture; on-site updates; About; Contact; and CRM authoring for launch-critical content. Paid music unlocks, music membership, announcement campaigns, analytics, ticket check-in, and secondary media/press tooling are deferred unless explicitly brought into launch scope.

## Operating rules for every batch

1. Start by recording the current branch, `git status --short`, `git diff --stat`, and relevant untracked files in **both** `jojjy-gallery-app` and `jojjy-gallery-crm`. The repositories are shared with ongoing work. The recorded dirty set changes over time; never assume an older handoff has the complete list.
2. Read existing diffs before editing overlapping files. Preserve all pre-existing work, including the event publishing changes and the media-blog publication changes currently visible in the public app. Do not restore, reset, stash, or overwrite unrelated work.
3. Do not expose environment-variable values, commit, or push. Do not run `prisma migrate dev` or `prisma migrate reset` against any shared or production database. Do not run migrations against production without explicit authorization and a reviewed migration plan.
4. Make only changes in the current batch. No broad refactors or product redesign. If the issue needs an external decision, production access, or unavailable credentials, document the exact blocker and proceed with independent work.
5. Test the changed behavior and report exact commands/results. If database connectivity, payment credentials, or deployment access are unavailable, say what could not be verified. Never claim success from static inspection alone.
6. Final report must separate pre-existing changes from batch changes, list files touched, checks run, remaining blockers, and whether the batch exit criteria passed.

## Batch sequence at a glance

| Batch | Goal | Depends on | Parallel work |
|---|---|---|---|
| 0 — Release baseline | Establish shared-schema, migration, deployment, and payment infrastructure certainty | None | No schema/deployment changes should proceed in parallel until the baseline is known |
| 1 — Public visitor journeys | Close concrete public-flow defects and publication/data-state gaps | Batch 0 event/deployment contract; V1 scope | Art journey and contact/audience work can be separated; homepage event selection has a single owner |
| 2 — CRM operating readiness | Ensure staff can author and publish all launch-critical content | Batch 0 schema parity; Batch 1 content/publication contract | CRM-only UI/API work can parallelize by domain after shared schema is frozen |
| 3 — Commerce and service integration | Verify and close the in-scope payment, email, and order lifecycle | Batch 0 payment baseline; Batch 1 chosen commerce scope; Batch 2 real CRM data | Contact email and commerce can be separate owners; keep order/payments files single-owner |
| 4 — Launch verification and release | Prove the chosen V1 flows in the target deployment and prepare release | Batches 0–3 | Manual page/accessibility review can run alongside deployment checks |
| 5 — Post-launch backlog | Deliver deferred capabilities only when prioritized by product evidence | V1 launched or explicitly re-scoped | Independent deferred features can be split by domain |

---

# Batch 0 — Release baseline and infrastructure certainty

## Objective

Determine whether the public app, CRM, migration histories, intended deployment, and current Event publishing implementation form a safe baseline for later work. This batch is infrastructure-focused, not a UI/product batch.

## Required work

1. Capture repository state for both repos, including current branch, dirty files, relevant diffs, and untracked migrations. The original Batch 0 handoff called out `lib/data/events.ts`, `pages/api/events/[slug].ts`, `prisma/schema.prisma`, and `20260829130000_add_event_publish_at/`. The current working tree also shows additional public-app changes, including `20261005000000_add_media_blog_published_at/`; preserve and inspect all of them. Do not assume this list stays fixed.
2. Compare the `Event` model and `publishAt` migrations in both schemas and migration histories. Identify the shared database migration owner from deployment scripts/docs. If the applied production migration state is unknown, do not guess or reconcile migration history blindly; state the exact safe status check needed.
3. Trace Event authoring and exposure through CRM forms/APIs, public event list/detail APIs, `lib/data/events.ts`, homepage usage, and sitemap. Document behavior for draft, scheduled, published, completed, cancelled, and missing `endsAt` cases.
4. Review read-triggered Event state transitions. Confirm which read paths write, whether the operation is deterministic/idempotent, and whether a failed transition breaks the request. Retain the approach unless a concrete correctness defect is found.
5. Confirm deployment path for app and CRM, migration execution order, build-time DB requirements, static/ISR behavior, and DB failure effects. At minimum inspect `/`, `/gallery`, `/portfolio`, `/shop`, `/events`, and dynamic static-generation routes.
6. Inspect Paystack initialization, verification/webhook, amount/currency/ownership validation, order fulfillment idempotency, and environment variable **names/status only**. Decide whether code is ready for a controlled smoke test; do not conduct a live payment in this batch.
7. Run safe schema/type/build checks where feasible. Do not run a destructive migration command or mutate shared production state.

## Out of scope

Homepage design, event UI redesign, navigation/terminology, payment UX, guest checkout, CRM feature work, background jobs, broad migration cleanup, and unrelated refactors.

## Exit criteria

- Event schema parity: PASS, FAIL, or BLOCKED with evidence.
- One understood migration path; production DB state explicitly proven or explicitly unknown.
- Deployment owner and migration timing identified, or exact decision blocker recorded.
- Build-time database dependencies and failure behavior described accurately.
- Event public contract is explicit across list/detail/homepage/sitemap; any mismatch is fixed only if concrete and minimal.
- Payment path is classified `READY FOR CONTROLLED SMOKE TEST` or `NOT READY`, with reasons.
- Batch 1 can proceed without risking unknown schema or deployment conflicts.

## Handoff to Batch 1

Provide the verified Event publication contract, schema/migration state, public-build constraints, and payment readiness. Carry the homepage past-event selection finding forward; do not fix it in Batch 0 unless touching that logic is strictly required for the publication contract.

---

# Batch 1 — Public visitor journeys and content-state correctness

## Objective

Make the agreed V1 visitor routes coherent end to end. Fix only evidence-backed defects in public discovery, state handling, links, and content filtering. Do not redesign the homepage or reopen its visual direction.

## Required work

1. Re-read the current diff in every file before editing; homepage and content surfaces already have in-progress changes.
2. Fix the homepage event input so every “Now”/“Take Something” event card uses the intended upcoming event or an intentional past-event fallback. Confirm the event order contract supplied by Batch 0.
3. Define and apply the public-content contract for the active domains: what makes artwork, series, MediaBlogEntry, events, releases, products, and announcements public. Keep draft/private content out of public APIs, sitemap, and homepage where the model supports publication state.
4. Verify and repair art journey: Portfolio → series/artwork → availability → inquiry or chosen purchase route. Keep artwork identity/detail canonical; avoid implementing a second competing checkout experience.
5. Verify and repair editorial journey: homepage “From the Studio” → Archive/Gallery → entry detail → return path. No placeholder/demo entry should be presented as real client content.
6. Verify the free music journey only: release listing → release detail → authorized free playback or clear unavailable state. Paid unlock/member flows are not a Batch 1 requirement.
7. Verify event listing/detail states, including draft exclusion, no events, past/completed events, cancelled events, missing media, and closed ticket actions. Do not change scheduling architecture.
8. Verify signup, updates, About, and Contact entry paths and errors. Ensure signup language does not promise communication that is not implemented.
9. Check mobile navigation, keyboard operation, focus visibility, reduced motion, missing image behavior, and page-level error/empty states for the in-scope journeys.

## Out of scope

Homepage art direction/animation redesign, new feature development, paid music, memberships, CRM-only improvements, analytics, and large-scale automated test infrastructure.

## Exit criteria

- Each in-scope route has an identified entry, working next action, return path, and explicit empty/error/unavailable behavior.
- Public endpoints, sitemap, homepage, and detail routes apply the same publication rules.
- The homepage never promotes an unintended past event as the upcoming action.
- No known demo or placeholder content is mistaken for approved production content.
- Changed routes pass targeted checks and a documented manual smoke walkthrough.

## Suggested ownership boundaries

- Owner A: artwork/Portfolio and its API/data rules.
- Owner B: editorial Archive/MediaBlog publication and homepage Studio data, only after schema contract is fixed.
- Owner C: events/homepage event selection, one owner for `pages/index.tsx` and homepage event props.
- Owner D: contact/audience and navigation links, only if the files do not overlap with another active change.

Parallelize only after Batch 0 has settled shared schema and publication rules. Homepage files are a high-overlap area; assign them to one owner.

---

# Batch 2 — CRM launch-critical authoring and publication

## Objective

Prove that staff can safely author, update, publish, and unpublish every content type the V1 public site needs. Keep all staff authoring in the CRM.

## Required work

1. Check CRM branch and dirty state independently. Confirm its Prisma schema and migration history still match the public app for shared tables before changing shared fields.
2. Log in through the CRM using an authorized staff account; do not use credentials copied from old handoff notes. Verify permission-gated dashboard/API access.
3. Test create/edit/publish/unpublish for launch-critical content: artworks, series, media blog/editorial, events/ticket types, products/variants, music releases/tracks (free discovery scope), and announcements for the on-site feed.
4. Verify media upload configuration and error handling for image/audio assets used in V1. Check that saved URLs are readable by the public app.
5. Close only authoring gaps that prevent agreed public content from being managed safely. Likely candidates: MediaBlog draft/publication control if V1 needs private drafts, and event schema/publish scheduling parity if Batch 0 finds a confirmed defect.
6. Confirm staff create/deactivate/role/permission flows work for the launch operators. No need to build analytics or ticket check-in.
7. For every authoring change, verify the result appears publicly only after the intended publication action and disappears/updates after unpublish/edit.

## Out of scope

CRM analytics, ticket scanning/check-in, announcement email/WhatsApp delivery, press mention authoring, series media tooling unless used by real launch content, redesigning the CRM, and adding unrelated staff roles.

## Exit criteria

- A launch operator can manage every in-scope content type without direct DB editing.
- Draft/private content stays private; publish/unpublish results match the public contract.
- Staff access is permission-checked at both page and API boundaries.
- Uploads work in the target environment or a documented asset workflow exists.
- Shared schema migrations are deployable by the owner established in Batch 0.

## Suggested ownership boundaries

Assign one CRM owner per independent dashboard domain after shared schema is frozen. Do not split shared Prisma/migration edits across parallel owners. CRM UI/API changes are mostly separable from public-page work, but schema and migration files are shared critical-path work.

---

# Batch 3 — Commerce, email, and operational integrations

## Objective

Close and verify only the customer-facing transactions that Batch 0 and product scope selected. Establish reliable payment completion, stock/ticket/artwork state, confirmation, and operational messaging.

## Required work

1. Confirm a safe Paystack test environment and required configuration. If unavailable, do not simulate success or run a live charge; report the external blocker.
2. For each in-scope purchase type, trace discovery → authenticated checkout → server-side order creation → Paystack initialization → return callback and webhook → server verification → amount/currency/ownership checks → idempotent fulfillment → confirmation → email.
3. Verify concurrent/repeated webhooks and callback verification do not double-decrement stock, issue duplicate tickets, or create repeated entitlements.
4. Verify artwork availability/reservation behavior against the selected launch policy; verify product variant stock and ticket capacity/sales windows on the server, not only in UI.
5. Confirm delivery method/address/packaging rules and buyer-facing terms for physical items. Do not add logistics features without a defined policy.
6. Configure and verify Resend for contact and order messages using approved sender/recipient settings. Do not build subscriber campaigns in this batch.
7. Record safe failure behavior: payment cancelled/failed, webhook delayed, verify unavailable, out-of-stock race, email unavailable, and retry/reload after return.

## Out of scope

Guest checkout, a general cart, new payment provider, recurring billing, music membership productization unless explicitly promoted into V1, refunds automation, announcement campaigns, and broad commerce refactors.

## Exit criteria

- Every advertised purchase type completes successfully in a controlled test environment and produces one correct paid order and fulfillment result.
- Failure and retry paths do not falsely confirm purchases or corrupt stock/ticket state.
- Production keys/webhook/callback/email configuration are documented by **name and target**, never by secret value.
- If a safe payment environment or external setup is absent, the affected purchase CTAs are withheld from launch scope and the precise blocker is reported.

## File ownership warning

Keep one owner for `pages/api/orders/checkout.ts`, `pages/api/paystack/*`, `lib/orders/*`, currency conversion, and confirmation page behavior. These files form one transaction boundary and should not be edited concurrently by different batches.

---

# Batch 4 — Launch verification and release readiness

## Objective

Prove the selected V1 definition of done in the actual target environment, then produce a release checklist with known client and operational dependencies.

## Required work

1. Confirm the release commit/revision includes reviewed app and CRM changes, with no unexplained dirty/untracked migration or schema change. This batch does not itself authorize committing or deploying.
2. Confirm the database schema is at the reviewed migration level using the safe deployment owner/process. Do not apply production migrations without the required approval.
3. Build and start both public app and CRM using the intended deployment procedure. Verify build-time DB access, runtime DB access, migrations-before-app ordering, and health/error logs.
4. Run the agreed manual smoke suite: homepage; art/series; free music; events; each advertised checkout; signup; updates; contact; auth/account if required; CRM publishing; mobile/keyboards; 404/missing-media paths; sitemap/robots/canonical URL.
5. Confirm analytics are not represented as available if no analytics product exists. Confirm signup copy reflects capture-only behavior if campaigns remain deferred.
6. Confirm client assets/content, production domains, payment/email services, and CRM operator access are ready. Keep secret values out of the report.
7. Produce a go/no-go table with evidence, not inferred status. Any unresolved P0 is a no-go for the affected advertised capability.

## Exit criteria

- All V1 critical journeys pass in the target environment or are deliberately removed from V1 scope.
- No unresolved P0 deployment, schema, payment, publication, or content-integrity blocker remains.
- Client and configuration dependencies are named with owners and dates where known.
- Launch operator has a short rollback/contact/runbook reference.

## Out of scope

Adding new features, broad performance tuning, extensive accessibility certification, SEO expansion, and post-launch backlog work.

---

# Batch 5 — Post-launch backlog

Start these only after V1 is stable or when product evidence elevates a specific item.

Potential work, each requiring a fresh scope and acceptance criteria:

- Paid music unlocks, Studio membership benefits, and recurring billing decisions.
- Announcement delivery via Resend/WhatsApp, including consent, confirmation, unsubscribe, and delivery status.
- CRM analytics, ticket check-in, press mentions, and series media management.
- Guest checkout, cart, richer order/customer support, shipping fulfillment, or refund operations.
- Artwork status/availability normalization, richer SEO/social cards, and systematic test coverage.
- Deeper performance, accessibility, and content discovery work based on real traffic and user feedback.

Do not treat unused models or unfinished plans as a commitment to ship them.

## Cross-batch decision and dependency register

| Decision/evidence | Must be resolved by | Why it matters |
|---|---|---|
| Which deployment owns the shared DB migration execution? | Batch 0 | Prevent app/CRM migration races and duplicate DDL |
| Is the `publishAt` migration applied to each target DB? | Batch 0 | Avoid runtime schema mismatch; do not infer from local history |
| What content is public versus draft in MediaBlog? | Batch 1 / Batch 2 | Prevent unpublished editorial content leaking through APIs/sitemap |
| Are paid music and memberships required for V1? | Batch 0 scope assumption, reconfirm before Batch 3 | Prevent unnecessary payment and CRM scope expansion |
| Which categories are actually sold at launch? | Before Batch 3 | Determines which checkout journeys require proof |
| Are customer accounts acceptable before buying? | Batch 1 product decision | Current checkout APIs require authentication |
| Who supplies final hero, bio, portrait, event, music and shop content? | Before Batch 4 | Engineering cannot safely fabricate artist assets/content |
| Are live payment/email credentials and safe test endpoints available? | Batch 0/3 | Determines readiness for controlled verification |

## Definition of successful plan execution

The plan is complete when Batch 4 records evidence that the agreed V1 journeys work in the target deployment, shared app/CRM schema and migrations are understood, launch operators can publish content through the CRM, external dependencies are ready, and deferred capabilities are clearly excluded from V1. A feature is not considered done merely because its route, model, CRM form, or UI exists.
