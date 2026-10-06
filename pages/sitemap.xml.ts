import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { getPublishedEvents } from "@/lib/data/events";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSiteMap(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

export default function SiteMap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.jojjygallery.com";

  const staticPages = [
    "",
    "/portfolio",
    "/gallery",
    "/events",
    "/updates",
    "/subscribe",
    "/shop",
    "/about",
    "/contact",
    "/music",
  ];

  const [artworks, publishedEvents, series, entries] = await Promise.all([
    prisma.artwork.findMany({
      where: { inGallery: true },
      select: { id: true },
    }),
    // Canonical event-publication logic: promotes due scheduled DRAFTs and
    // exposes exactly PUBLISHED + COMPLETED, so the sitemap can never lag
    // behind (or leak ahead of) the visitor-facing event surfaces.
    getPublishedEvents().then((events) =>
      events.map((e) => ({ slug: e.slug }))
    ),
    prisma.series.findMany({ select: { slug: true } }),
    prisma.mediaBlogEntry.findMany({
      where: { publishedAt: { lte: new Date() } },
      select: { id: true },
    }),
  ]);

  const urls = [
    ...staticPages.map((path) => `${base}${path}`),
    ...artworks.map((a) => `${base}/artworks/${a.id}`),
    ...artworks
      .filter((a) => a.id)
      .map((a) => `${base}/shop/${a.id}`),
    ...publishedEvents.map((e) => `${base}/events/${e.slug}`),
    ...series.map((s) => `${base}/portfolio/${s.slug}`),
    ...entries.map((e) => `${base}/gallery/${e.id}`),
  ];

  const uniqueUrls = [...new Set(urls)];

  res.setHeader("Content-Type", "text/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.write(generateSiteMap(uniqueUrls));
  res.end();

  return { props: {} };
};
