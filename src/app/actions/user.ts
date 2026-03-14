"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const VALID_ROLES = ["DEV", "QA"] as const;

function isValidRole(value: string): value is (typeof VALID_ROLES)[number] {
  return VALID_ROLES.includes(value as (typeof VALID_ROLES)[number]);
}

export async function updateUserProfile(formData: FormData): Promise<void> {
  const rawRole = (formData.get("role") as string)?.trim() || null;
  const isScrumMaster = formData.get("isScrumMaster") === "on";

  const role = rawRole && isValidRole(rawRole) ? rawRole : null;

  if (!role && !isScrumMaster) {
    redirect("/settings?error=no_selection");
  }

  const userId = await getSession();
  if (!userId) redirect("/login");

  await prisma.user.update({
    where: { id: userId },
    data: { role, isScrumMaster },
  });

  redirect("/settings?saved=1");
}
