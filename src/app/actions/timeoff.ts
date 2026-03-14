"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import { startOfDay } from "date-fns";

async function requireProjectSM(projectId: string) {
  const userId = await getSession();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership) throw new Error("Нет доступа к проекту");
  if (!hasSmRights(user, membership))
    throw new Error("Только Scrum Master может выполнять это действие");
  return user;
}

export async function toggleTimeOff(
  projectId: string,
  userId: string,
  dateISO: string,
) {
  await requireProjectSM(projectId);

  const targetMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!targetMembership) return { error: "Пользователь не участник проекта" };

  const date = startOfDay(new Date(dateISO));

  const existing = await prisma.timeOff.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (existing) {
    await prisma.timeOff.delete({ where: { id: existing.id } });
    return { success: true, action: "removed" as const };
  }

  await prisma.timeOff.create({
    data: { userId, date, type: "VACATION" },
  });

  return { success: true, action: "added" as const };
}
