"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const VALID_ROLES = ["DEV", "QA", "SCRUM_MASTER"] as const;

function isValidRole(value: string | null): value is (typeof VALID_ROLES)[number] {
  return VALID_ROLES.includes(value as (typeof VALID_ROLES)[number]);
}

export async function updateUserRole(formData: FormData): Promise<void> {
  const role = formData.get("role") as string | null;

  if (!isValidRole(role)) {
    redirect("/settings?error=invalid_role");
  }

  const userId = await getSession();
  if (!userId) redirect("/login");

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  redirect("/settings?saved=1");
}
