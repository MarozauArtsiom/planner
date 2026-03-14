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
  const password = formData.get("password") as string;
  const role = formData.get("role") as string | null;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!name || name.length < 2)
    return { error: "Ник минимум 2 символа" };
  if (!password || password.length < 4)
    return { error: "Пароль минимум 4 символа" };
  if (!isValidRole(role)) return { error: "Выберите роль" };

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) return { error: "Этот ник уже занят" };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { passwordHash, name, role },
  });

  await setSession(user.id);
  redirect(redirectTo);
}

export async function login(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!name || !password)
    return { error: "Введите ник и пароль" };

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) return { error: "Неверный ник или пароль" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Неверный ник или пароль" };

  await setSession(user.id);
  redirect(redirectTo);
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
