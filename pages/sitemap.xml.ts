import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";

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
    "/shop",
    "/about",
    "/contact",
    "/music",
  ];

  const [artworks, events, series, entries] = await Promise.all([
    prisma.artwork.findMany({
      where: { inGallery: true },
      select: { id: true },
    }),
    prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "COMPLETED"] } },
      select: { slug: true },
    }),
    prisma.series.findMany({ select: { slug: true } }),
    prisma.mediaBlogEntry.findMany({ select: { id: true } }),
  ]);

  const urls = [
    ...staticPages.map((path) => `${base}${path}`),
    ...artworks.map((a) => `${base}/artworks/${a.id}`),
    ...artworks
      .filter((a) => a.id)
      .map((a) => `${base}/shop/${a.id}`),
    ...events.map((e) => `${base}/events/${e.slug}`),
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
