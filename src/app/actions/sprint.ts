"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import {
  getSprintEndDate,
  getNextSprintStart,
  renderSprintName,
} from "@/lib/date-utils";

async function requireUser() {
  const userId = await getSession();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  return user;
}

async function requireProjectSM(projectId: string) {
  const t = await getTranslations("errors");
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership) throw new Error(t("noProjectAccess"));
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!hasSmRights(user.id, membership, project))
    throw new Error(t("onlySmAction"));
  return user;
}

export async function createSprint(projectId: string, startDateISO?: string) {
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { sprintDurationWeeks: true, sprintNameTemplate: true },
  });
  if (!project) return { error: t("projectNotFound") };

  const existingSprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: { startDate: "desc" },
    take: 1,
  });

  let startDate: Date;

  if (existingSprints.length === 0) {
    if (!startDateISO) {
      return { error: t("firstSprintDateRequired") };
    }
    startDate = new Date(startDateISO);
  } else {
    const lastSprint = existingSprints[0];
    startDate = getNextSprintStart(lastSprint.endDate);
  }

  const endDate = getSprintEndDate(startDate, project.sprintDurationWeeks);

  const sprintCount = await prisma.sprint.count({ where: { projectId } });
  const sprintNumber = sprintCount + 1;
  const name = renderSprintName(project.sprintNameTemplate, sprintNumber, startDate);

  await prisma.sprint.create({
    data: { name, startDate, endDate, projectId },
  });

  return { success: true };
}

export async function deleteSprint(sprintId: string, projectId: string) {
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);

  const lastSprint = await prisma.sprint.findFirst({
    where: { projectId },
    orderBy: { endDate: "desc" },
  });

  if (!lastSprint || lastSprint.id !== sprintId) {
    return { error: t("canDeleteOnlyLast") };
  }

  const ticketsOnSprint = await prisma.ticket.count({ where: { sprintId } });
  if (ticketsOnSprint > 0) {
    return { error: t("cannotDeleteSprintWithTickets") };
  }

  const assignmentsInRange = await prisma.ticketAssignment.count({
    where: {
      ticket: { projectId },
      startDate: { lte: lastSprint.endDate },
      AND: { startDate: { gte: lastSprint.startDate } },
    },
  });
  if (assignmentsInRange > 0) {
    return { error: t("cannotDeleteSprintWithAssignments") };
  }

  await prisma.sprint.delete({ where: { id: sprintId } });
  return { success: true };
}

export async function renameSprint(sprintId: string, projectId: string, newName: string) {
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);

  const trimmed = newName.trim();
  if (!trimmed) return { error: t("nameRequired") };
  if (trimmed.length > 100) return { error: t("maxChars") };

  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint || sprint.projectId !== projectId) {
    return { error: t("sprintNotFound") };
  }

  await prisma.sprint.update({
    where: { id: sprintId },
    data: { name: trimmed },
  });

  return { success: true };
}

export async function recalcFutureSprints(projectId: string, newDurationWeeks: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { activeSprintId: true },
  });

  const allSprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: { startDate: "asc" },
  });

  if (allSprints.length === 0) return;

  let activeIndex = -1;
  if (project?.activeSprintId) {
    activeIndex = allSprints.findIndex((s) => s.id === project.activeSprintId);
  }
  if (activeIndex === -1) {
    const now = new Date();
    activeIndex = allSprints.findIndex((s) => s.endDate >= now);
    if (activeIndex === -1) activeIndex = allSprints.length - 1;
  }

  for (let i = activeIndex + 1; i < allSprints.length; i++) {
    const prev = allSprints[i - 1];
    const prevEnd = i - 1 > activeIndex ? getSprintEndDate(prev.startDate, newDurationWeeks) : prev.endDate;
    const newStart = getNextSprintStart(prevEnd);
    const newEnd = getSprintEndDate(newStart, newDurationWeeks);

    allSprints[i] = { ...allSprints[i], startDate: newStart, endDate: newEnd };

    await prisma.sprint.update({
      where: { id: allSprints[i].id },
      data: { startDate: newStart, endDate: newEnd },
    });
  }
}
