# Launch Implementation Plans

> Generated from the [Launch Checklist](../../LAUNCH_CHECKLIST.md) audit (2026-07-21).

These documents are **action plans**, not feature specs. Each one describes how to close a release blocker or pre-launch gap. Work them in order unless a dependency note says otherwise.

## Sprint order

| # | Plan | Repo(s) | Effort | Depends on |
| - | ---- | ------- | ------ | ---------- |
| 1 | [Image naming (Cloudinary)](./01-image-naming-cloudinary.md) | CRM | S | — |
| 2 | [Paystack payment end-to-end](./02-paystack-payment-end-to-end.md) | Gallery | L | — |
| 3 | [Inventory & order fulfillment](./03-inventory-order-fulfillment.md) | Gallery | M | Plan 2 |
| 4 | [Secure media-blog APIs](./04-secure-media-blog-apis.md) | Gallery | S | — |
| 5 | [CRM staff & permissions](./05-crm-staff-permissions.md) | CRM | L | — |
| 6 | [Ticket sales window](./06-ticket-sales-window.md) | CRM + Gallery | M | Plan 2 (for ticket checkout) |
| 7 | [Production migrations](./07-production-migrations.md) | Both | S | User approval |
| 8 | [SEO: robots.txt & sitemap](./08-seo-robots-sitemap.md) | Gallery | S | — |
| 9 | [Music paid unlock checkout](./09-music-paid-unlock-checkout.md) | Gallery | M | Plans 2–3 (Paystack + fulfillment base) |
| 10 | [The Studio experience](./10-studio-experience.md) | Gallery (+ CRM Phase B) | L | Plan 9 (commerce baseline) |
| 11 | [Audience (newsletter) MVP](./11-audience-newsletter-mvp.md) | Gallery + CRM | S | Shared `Subscriber` schema |

**Effort key:** S = half day · M = 1–2 days · L = 2–4 days

## After release blockers

Polish and business items stay tracked in [LAUNCH_CHECKLIST.md](../../LAUNCH_CHECKLIST.md) under **Polish**, **Business**, and **Version 2**.

**Music module:** [Plan 09 — Music paid unlock checkout](./09-music-paid-unlock-checkout.md) closes the paid-release loop (tease → Paystack → `ReleaseUnlock`). [Plan 10 — The Studio experience](./10-studio-experience.md) adds the emotional layer: dedicated `/music/studio`, language, library split, and belonging UX on top of MVP commerce.

**Audience:** [Plan 11 — Audience (newsletter) MVP](./11-audience-newsletter-mvp.md) collects guest emails via a dedicated `/subscribe` page + scroll modal CTA, plus CRM list/search/CSV. No footer form, no sending or campaigns. CRM module named **Audience**, not Newsletter.

## Repos

| Repo | Path | Role |
| ---- | ---- | ---- |
| Gallery (public) | `jojjy-gallery-app` | Browse, checkout, read APIs |
| CRM (staff) | `jojjy-gallery-crm` | Content CRUD, uploads, permissions |

Both share the same Prisma schema and Postgres database.
