"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function updateUserProfile(formData: FormData): Promise<void> {
  const isScrumMaster = formData.get("isScrumMaster") === "on";

  const userId = await getSession();
  if (!userId) redirect("/login");

  await prisma.user.update({
    where: { id: userId },
    data: { isScrumMaster },
  });

  redirect("/settings?saved=1");
}
