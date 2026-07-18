import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (MUTATING.has(request.method)) {
    response.headers.set("Cache-Control", "private, no-store");
  } else {
    response.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
