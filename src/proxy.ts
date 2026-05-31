import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/invite",
  "/poker",
  "/terms",
  "/privacy",
  "/cookies",
];
const LANDING_PATH = "/";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LANDING_PATH) return NextResponse.next();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const userId = request.cookies.get("userId")?.value;

  if (!userId) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
