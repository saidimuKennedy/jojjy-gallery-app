# Plan 08 — SEO: robots.txt & Sitemap

**Status:** Not started  
**Repo:** `jojjy-gallery-app`  
**Effort:** S (half day)  
**Blocks launch:** Soft (SEO / discoverability)

---

## Goal

Add `robots.txt` and a dynamic sitemap so search engines can crawl public pages. Improve baseline meta where cheap.

---

## Current state

| Item | Status |
| ---- | ------ |
| `public/robots.txt` | ❌ Missing |
| Sitemap | ❌ No `pages/sitemap.xml.ts` or `next-sitemap` config |
| Page meta | Basic `<title>` + `description` on most pages |
| Open Graph / Twitter | ❌ Not implemented |
| JSON-LD | ❌ Not implemented |

---

## Scope

### In scope (v1)

- Static `public/robots.txt`
- Dynamic sitemap at `/sitemap.xml` listing public routes
- Reference sitemap in robots.txt
- Disallow `/api/`, `/account/`, `/login`, `/register`

### Out of scope (follow-up)

- Full OG/Twitter tags per page
- JSON-LD `VisualArtwork` schema
- `hreflang` / i18n
- Google Search Console setup

---

## Implementation steps

### Step 1 — robots.txt

Create `public/robots.txt`:

```txt
User-agent: *
Allow: /

Disallow: /api/
Disallow: /account/
Disallow: /login
Disallow: /register

Sitemap: https://www.jojjygallery.com/sitemap.xml
```

Replace domain with `process.env.NEXT_PUBLIC_SITE_URL` if generating dynamically via `pages/robots.txt.ts` (optional).

### Step 2 — Dynamic sitemap

Create `pages/sitemap.xml.ts` (Pages Router pattern):

```ts
import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";

function generateSiteMap(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.jojjygallery.com";

  const staticPages = ["", "/portfolio", "/gallery", "/events", "/shop", "/about", "/contact", "/music"];

  const [artworks, events, series, entries] = await Promise.all([
    prisma.artwork.findMany({ where: { inGallery: true }, select: { id: true } }),
    prisma.event.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } }),
    prisma.series.findMany({ select: { slug: true } }),
    prisma.mediaBlogEntry.findMany({ select: { id: true } }),
  ]);

  const urls = [
    ...staticPages.map((p) => `${base}${p}`),
    ...artworks.map((a) => `${base}/artworks/${a.id}`),
    ...artworks.map((a) => `${base}/shop/${a.id}`),
    ...events.map((e) => `${base}/events/${e.slug}`),
    ...series.map((s) => `${base}/portfolio/${s.slug}`),
    ...entries.map((e) => `${base}/gallery/${e.id}`),
  ];

  res.setHeader("Content-Type", "text/xml");
  res.write(generateSiteMap(urls));
  res.end();
  return { props: {} };
};

export default function SiteMap() {}
```

Adjust filters to match public visibility rules (`isAvailable`, `inGallery`, etc.).

### Step 3 — Environment

Add to `.env.example`:

```env
NEXT_PUBLIC_SITE_URL=https://www.jojjygallery.com
```

Use in sitemap + canonical URLs later.

### Step 4 — Cache

Set short cache on sitemap: `Cache-Control: public, s-maxage=3600, stale-while-revalidate`.

Or use `getServerSideProps` with revalidation if migrating to ISR pattern later.

### Step 5 — Verify

- `curl /robots.txt`
- `curl /sitemap.xml` — valid XML, contains homepage + sample artwork
- Google Search Console → submit sitemap (manual, post-deploy)

---

## Files to touch

| File | Change |
| ---- | ------ |
| `public/robots.txt` | **New** |
| `pages/sitemap.xml.ts` | **New** |
| `.env.example` | `NEXT_PUBLIC_SITE_URL` |
| `scripts/audit-env.mjs` | Include site URL if auditing |

---

## Optional quick wins (same PR)

Add to `pages/_app.tsx` or per-page `Head`:

```tsx
<meta property="og:site_name" content="Jojjy Gallery" />
<meta property="og:type" content="website" />
```

Per artwork/event pages: `og:title`, `og:image` from `artwork.imageUrl` (Cloudinary transform `w_1200`).

---

## Test plan

1. `/robots.txt` returns 200, disallows `/api/`
2. `/sitemap.xml` valid XML, no duplicate URLs
3. Unpublished events excluded
4. Sitemap URL count reasonable (< 1000 for v1)
5. Lighthouse SEO audit — sitemap discoverable

---

## Acceptance criteria

- [ ] robots.txt live in production
- [ ] sitemap.xml lists all public indexable routes
- [ ] `NEXT_PUBLIC_SITE_URL` documented
- [ ] LAUNCH_CHECKLIST SEO rows → ✅
