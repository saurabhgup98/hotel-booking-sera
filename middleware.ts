import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

// Pages that need a logged-in guest.
const PROTECTED_PREFIXES = ["/bookings", "/payment", "/booking"];
// Kept on the login page when a link sends a logged-out guest there, so
// APTI's SDK still sees where the visit came from (e.g. a WhatsApp button).
const CAMPAIGN_PARAM = /^(utm_[a-z]+|ref_id)$/;

export async function middleware(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  // APTI's WhatsApp buttons end in a value we fill in (e.g.
  // "/payment/<id>?utm_source=…"). If the "?" arrives encoded ("%3F…"),
  // turn it back into a real query string.
  const encodedQuery = pathname.search(/%3F/i);
  if (encodedQuery !== -1) {
    const target = new URL(pathname.slice(0, encodedQuery) || "/", request.url);
    let extra = new URLSearchParams();
    try {
      extra = new URLSearchParams(decodeURIComponent(pathname.slice(encodedQuery + 3)));
    } catch {}
    extra.forEach((value, key) => target.searchParams.set(key, value));
    searchParams.forEach((value, key) => target.searchParams.set(key, value));
    return NextResponse.redirect(target);
  }

  if (!PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    searchParams.forEach((value, key) => {
      if (CAMPAIGN_PARAM.test(key)) loginUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Every page (for the encoded-link fix); not API routes, Next's own files
  // or static files.
  matcher: ["/((?!api/|_next/|.*\\.[A-Za-z0-9]+$).*)"],
};
