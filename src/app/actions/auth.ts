"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSession, clearSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

const VALID_ROLES = ["DEV", "QA", "SCRUM_MASTER"] as const;

function isValidRole(v: string | null): v is (typeof VALID_ROLES)[number] {
  return VALID_ROLES.includes(v as (typeof VALID_ROLES)[number]);
}

export async function register(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const login = (formData.get("login") as string)?.trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string | null;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!name) return { error: "Имя обязательно" };
  if (!login || login.length < 3)
    return { error: "Логин минимум 3 символа" };
  if (!password || password.length < 4)
    return { error: "Пароль минимум 4 символа" };
  if (!isValidRole(role)) return { error: "Выберите роль" };

  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) return { error: "Этот логин уже занят" };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { login, passwordHash, name, role },
  });

  await setSession(user.id);
  redirect(redirectTo);
}

export async function login(formData: FormData) {
  const login = (formData.get("login") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!login || !password)
    return { error: "Введите логин и пароль" };

  const user = await prisma.user.findUnique({ where: { login } });
  if (!user) return { error: "Неверный логин или пароль" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Неверный логин или пароль" };

  await setSession(user.id);
  redirect(redirectTo);
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
