import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authEdgeConfig } from "~/server/auth/config.edge";

const { auth: authMiddleware } = NextAuth(authEdgeConfig);

const PUBLIC_PATHS = ["/", "/login"];
const PUBLIC_PREFIXES = ["/certificate/", "/api/", "/_next/", "/favicon"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export default authMiddleware((req) => {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const session = req.auth;
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const { roleKind, status } = session.user;

  if (!roleKind) {
    if (pathname.startsWith("/register")) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/register";
    return NextResponse.redirect(url);
  }

  const dashboardRoot = `/dashboard/${roleKind}`;
  if (pathname === "/register" || pathname.startsWith("/register/")) {
    const url = req.nextUrl.clone();
    url.pathname = dashboardRoot;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard/")) {
    const isAdmin = roleKind === "admin";
    if (!isAdmin && !pathname.startsWith(dashboardRoot)) {
      const url = req.nextUrl.clone();
      url.pathname = dashboardRoot;
      return NextResponse.redirect(url);
    }
  }

  if (status === "declined" && pathname !== "/declined") {
    const url = req.nextUrl.clone();
    url.pathname = "/declined";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
