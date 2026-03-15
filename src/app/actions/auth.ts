"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { setSession, clearSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function register(formData: FormData) {
  const t = await getTranslations("errors");
  const name = (formData.get("name") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!name || name.length < 2)
    return { error: t("nickMin2") };
  if (!password || password.length < 4)
    return { error: t("passwordMin4") };

  try {
    const existing = await prisma.user.findUnique({ where: { name } });
    if (existing) return { error: t("nickTaken") };

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { passwordHash, name },
    });

    await setSession(user.id);
  } catch (e) {
    console.error("[register] Error:", e);
    const message = e instanceof Error ? e.message : t("unknownError");
    return { error: t("registerError", { message }) };
  }
  redirect(redirectTo);
}

export async function login(formData: FormData) {
  const t = await getTranslations("errors");
  const name = (formData.get("name") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!name || !password)
    return { error: t("enterCredentials") };

  try {
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) return { error: t("invalidCredentials") };

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { error: t("invalidCredentials") };

    await setSession(user.id);
  } catch (e) {
    console.error("[login] Error:", e);
    const message = e instanceof Error ? e.message : t("unknownError");
    return { error: t("loginError", { message }) };
  }
  redirect(redirectTo);
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
