import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Only list endpoints that never read the session may be shared-cached.
// Everything else (auth, library, per-release access, account, ...) varies
// per viewer and must not be served from the CDN to other people.
const PUBLIC_CACHEABLE = new Set([
  "/api/artworks",
  "/api/series",
  "/api/products",
  "/api/events",
  "/api/announcements",
  "/api/media-blog",
  "/api/music/releases",
]);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const path = request.nextUrl.pathname.replace(/\/$/, "");

  if (MUTATING.has(request.method) || !PUBLIC_CACHEABLE.has(path)) {
    response.headers.set("Cache-Control", "private, no-store");
  } else {
    response.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
