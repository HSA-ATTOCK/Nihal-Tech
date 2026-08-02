import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

const ADMIN_PREFIX = "/admin";

// --- API CORS handling -----------------------------------------------------
// Lets the mobile app's Expo *web* preview (`expo start` -> `w`, served from
// http://localhost:8081) call the live API without hitting CORS errors.
// Native iOS/Android requests are never subject to CORS, so this only matters
// for local web-preview testing. Scoped to /api/* by the branch below.
const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS =
  "Content-Type, Authorization, X-Auth-Return-Redirect, X-Requested-With";

function buildCorsHeaders(origin: string | null) {
  const headers = new Headers();
  if (origin) {
    // Reflect the request's origin rather than using "*" so that
    // credentialed (cookie-based) requests from the NextAuth session
    // flow continue to work.
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  return headers;
}

function handleApiCors(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  // Preflight requests never reach the route handler, so answer them here.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  corsHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
}

// --- Admin auth redirect (pre-existing behavior) ---------------------------
const authProxy = withAuth(
  function proxy(req) {
    const token = req.nextauth?.token;
    const { pathname } = req.nextUrl;
    const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);

    // If an admin visits any non-admin page, send them to the admin dashboard.
    if (token?.role === "ADMIN" && !isAdminRoute) {
      const url = new URL(`${ADMIN_PREFIX}/dashboard`, req.url);
      return NextResponse.redirect(url);
    }

    // Protect admin routes: require auth and ADMIN role.
    if (isAdminRoute) {
      if (!token) {
        const url = new URL("/login", req.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
      if (token.role !== "ADMIN") {
        const url = new URL("/", req.url);
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Allow public routes to render; we handle redirects manually above.
      authorized: () => true,
    },
  },
);

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return handleApiCors(request);
  }
  return (authProxy as unknown as (req: NextRequest) => Response | Promise<Response>)(
    request,
  );
}

export const config = {
  // Run on everything except Next.js internals and static assets, so both
  // the admin-auth-redirect logic (pages) and CORS handling (/api/*) apply.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)", "/api/:path*"],
};
