import { cookies } from "next/headers";

const SESSION_COOKIE = "userId";
const USER_TYPE_COOKIE = "userType";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * UserType — мини-RBAC, разделяющий доступ.
 *
 * - `"user"`  — зарегистрированный аккаунт (есть `passwordHash`). Полный доступ
 *               ко всем страницам: dashboard, проекты, Gantt, settings, и т.д.
 * - `"guest"` — гость, созданный для Quick Poker (TTL 24h, нет пароля).
 *               Разрешено ТОЛЬКО `/poker/*`, legal pages и auth-страницы.
 *
 * Cookie httpOnly — клиент не может его подменить. Используется в `proxy.ts`
 * для блокировки доступа без БД-запроса (Edge-friendly).
 */
export type UserType = "user" | "guest";

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSession(
  userId: string,
  userType: UserType = "user",
): Promise<void> {
  const cookieStore = await cookies();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };
  cookieStore.set(SESSION_COOKIE, userId, opts);
  cookieStore.set(USER_TYPE_COOKIE, userType, opts);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(USER_TYPE_COOKIE);
}

export async function getUserType(): Promise<UserType | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(USER_TYPE_COOKIE)?.value;
  if (value === "user" || value === "guest") return value;
  return null;
}
