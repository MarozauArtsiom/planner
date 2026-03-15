"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale") as string;
  if (!locale) return;

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect("/settings?saved=1");
}
