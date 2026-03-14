"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  isWednesday,
  getSprintEndDate,
  getNextSprintStart,
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
  if (user.role !== "SCRUM_MASTER")
    throw new Error("Только Scrum Master может выполнять это действие");
  return user;
}

export async function createSprint(projectId: string, startDateISO?: string) {
  await requireProjectSM(projectId);

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
    if (!isWednesday(startDate)) {
      return { error: "Спринт должен начинаться в среду" };
    }
  } else {
    const lastSprint = existingSprints[0];
    startDate = getNextSprintStart(lastSprint.endDate);
  }

  const endDate = getSprintEndDate(startDate);

  const sprintCount = await prisma.sprint.count({ where: { projectId } });
  const name = `Sprint ${sprintCount + 1}`;

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
