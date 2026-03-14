"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSession, clearSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function register(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const password = formData.get("password") as string;
  const isScrumMaster = formData.get("isScrumMaster") === "on";
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!name || name.length < 2)
    return { error: "Ник минимум 2 символа" };
  if (!password || password.length < 4)
    return { error: "Пароль минимум 4 символа" };

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) return { error: "Этот ник уже занят" };

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { passwordHash, name, isScrumMaster },
    });

    await setSession(user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Ошибка регистрации: ${message}` };
  }
  redirect(redirectTo);
}

export async function login(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!name || !password)
    return { error: "Введите ник и пароль" };

  try {
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) return { error: "Неверный ник или пароль" };

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { error: "Неверный ник или пароль" };

    await setSession(user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Ошибка входа: ${message}` };
  }
  redirect(redirectTo);
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
