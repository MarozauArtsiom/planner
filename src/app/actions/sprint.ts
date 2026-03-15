"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import {
  isCorrectStartDay,
  getSprintEndDate,
  getNextSprintStart,
  renderSprintName,
  DAY_NAMES,
} from "@/lib/date-utils";

async function requireUser() {
  const userId = await getSession();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  return user;
}

async function requireProjectSM(projectId: string) {
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership) throw new Error("Нет доступа к проекту");
  if (!hasSmRights(user, membership))
    throw new Error("Только Scrum Master может выполнять это действие");
  return user;
}

export async function createSprint(projectId: string, startDateISO?: string) {
  await requireProjectSM(projectId);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      sprintDurationWeeks: true,
      sprintStartDay: true,
      sprintNameTemplate: true,
    },
  });
  if (!project) return { error: "Проект не найден" };

  const existingSprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: { startDate: "desc" },
    take: 1,
  });

  let startDate: Date;

  if (existingSprints.length === 0) {
    if (!startDateISO) {
      return { error: "Необходимо указать дату начала первого спринта" };
    }
    startDate = new Date(startDateISO);
    if (!isCorrectStartDay(startDate, project.sprintStartDay)) {
      return { error: `Спринт должен начинаться в ${DAY_NAMES[project.sprintStartDay]}` };
    }
  } else {
    const lastSprint = existingSprints[0];
    startDate = getNextSprintStart(lastSprint.endDate);
  }

  const endDate = getSprintEndDate(startDate, project.sprintDurationWeeks);

  const sprintCount = await prisma.sprint.count({ where: { projectId } });
  const sprintNumber = sprintCount + 1;
  const name = renderSprintName(
    project.sprintNameTemplate,
    sprintNumber,
    startDate,
  );

  await prisma.sprint.create({
    data: {
      name,
      startDate,
      endDate,
      projectId,
    },
  });

  return { success: true };
}

export async function deleteSprint(sprintId: string, projectId: string) {
  await requireProjectSM(projectId);

  const lastSprint = await prisma.sprint.findFirst({
    where: { projectId },
    orderBy: { endDate: "desc" },
  });

  if (!lastSprint || lastSprint.id !== sprintId) {
    return { error: "Можно удалить только последний спринт" };
  }

  const ticketsOnSprint = await prisma.ticket.count({
    where: { sprintId },
  });
  if (ticketsOnSprint > 0) {
    return { error: "Нельзя удалить спринт с привязанными тикетами" };
  }

  const assignmentsInRange = await prisma.ticketAssignment.count({
    where: {
      ticket: { projectId },
      startDate: { lte: lastSprint.endDate },
      AND: {
        startDate: { gte: lastSprint.startDate },
      },
    },
  });
  if (assignmentsInRange > 0) {
    return { error: "Нельзя удалить спринт с назначенными задачами" };
  }

  await prisma.sprint.delete({ where: { id: sprintId } });

  return { success: true };
}

export async function renameSprint(
  sprintId: string,
  projectId: string,
  newName: string,
) {
  await requireProjectSM(projectId);

  const trimmed = newName.trim();
  if (!trimmed) return { error: "Название не может быть пустым" };
  if (trimmed.length > 100) return { error: "Максимум 100 символов" };

  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint || sprint.projectId !== projectId) {
    return { error: "Спринт не найден" };
  }

  await prisma.sprint.update({
    where: { id: sprintId },
    data: { name: trimmed },
  });

  return { success: true };
}

export async function recalcFutureSprints(
  projectId: string,
  newDurationWeeks: number,
) {
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
    const prevEnd = i - 1 > activeIndex
      ? getSprintEndDate(prev.startDate, newDurationWeeks)
      : prev.endDate;
    const newStart = getNextSprintStart(prevEnd);
    const newEnd = getSprintEndDate(newStart, newDurationWeeks);

    allSprints[i] = { ...allSprints[i], startDate: newStart, endDate: newEnd };

    await prisma.sprint.update({
      where: { id: allSprints[i].id },
      data: { startDate: newStart, endDate: newEnd },
    });
  }
}
