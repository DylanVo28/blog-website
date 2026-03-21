import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_ROUTES,
  AUTH_COOKIE_KEY,
  AUTH_ROLE_COOKIE_KEY,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
} from "./lib/constants";

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_KEY)?.value;
  const role = request.cookies.get(AUTH_ROLE_COOKIE_KEY)?.value;

  if (matchesRoute(pathname, AUTH_ROUTES) && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (matchesRoute(pathname, PROTECTED_ROUTES) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
