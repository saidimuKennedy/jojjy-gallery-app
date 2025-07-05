import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
