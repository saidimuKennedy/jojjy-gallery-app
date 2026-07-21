import type { NextApiResponse } from "next";

interface CacheOptions {
  sMaxAge?: number;
  swr?: number;
}

/** Set CDN-friendly cache headers on public GET API responses. */
export function setPublicCacheHeaders(
  res: NextApiResponse,
  { sMaxAge = 120, swr = 600 }: CacheOptions = {}
): void {
  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
  );
}
