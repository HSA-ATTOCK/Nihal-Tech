import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const ADMIN_PREFIX = "/admin";

export default withAuth(
  function middleware(req) {
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

export const config = {
  // Run on all app routes except Next.js internals, static assets, and API.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)"],
};
