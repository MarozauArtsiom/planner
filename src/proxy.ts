import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Public-везде paths — доступны всем, без авторизации.
 */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/invite",
  "/poker",
  "/terms",
  "/privacy",
  "/cookies",
];

/**
 * Guest-разрешённые paths — куда guest-юзер (userType=guest) имеет доступ
 * сверх PUBLIC_PATHS. Всё остальное — только для зарегистрированных юзеров.
 *
 * Гостям ЯВНО разрешено: Quick Poker и легальные страницы.
 * Всё, что вне этого набора — должно требовать полноценный аккаунт.
 */
const GUEST_ALLOWED_PATHS = [
  "/poker",
  "/terms",
  "/privacy",
  "/cookies",
  "/login",
  "/register",
];

const LANDING_PATH = "/";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lending page доступна всем (там разные варианты для guest / authed)
  if (pathname === LANDING_PATH) return NextResponse.next();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const userId = request.cookies.get("userId")?.value;
  const userType = request.cookies.get("userType")?.value;

  // Unauthenticated user → пускаем только в публичные
  if (!userId) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Guest user — жёсткое ограничение по разрешённым путям
  if (userType === "guest") {
    const isGuestAllowed = GUEST_ALLOWED_PATHS.some((p) =>
      pathname.startsWith(p),
    );
    if (!isGuestAllowed) {
      // Редирект на /login с флагом — UI покажет «Это гостевой аккаунт»
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("guestUpgrade", "1");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Полноценный авторизованный пользователь — пропускаем
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
