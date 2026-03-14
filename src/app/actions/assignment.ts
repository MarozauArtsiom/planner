"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import { spToDurationDays, workingDaysToCalendarSpan, toDateKey } from "@/lib/date-utils";
import { addDays } from "date-fns";

async function getUserTimeOffSet(userId: string): Promise<Set<string>> {
  const records = await prisma.timeOff.findMany({
    where: { userId },
    select: { date: true },
  });
  return new Set(records.map((r) => toDateKey(r.date)));
}

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

export async function assignTicket(
  projectId: string,
  ticketId: string,
  userId: string,
  startDateISO: string,
  dropRole: "DEV" | "QA",
) {
  await requireProjectSM(projectId);

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.projectId !== projectId)
    return { error: "Тикет не найден" };
  if (ticket.storyPoints == null)
    return { error: "Тикет не оценён" };

  const totalDays = spToDurationDays(ticket.storyPoints);
  const proportion = ticket.devEffortProportion ?? 0.5;
  const devDays = Math.max(1, Math.round(totalDays * proportion));
  const qaDays = Math.max(1, totalDays - devDays);

  let devUserId = userId;
  let qaUserId: string | null = null;

  if (dropRole === "DEV") {
    const qaMember = await prisma.projectMember.findFirst({
      where: { projectId, role: "QA" },
    });
    qaUserId = qaMember?.userId ?? null;
  } else {
    qaUserId = userId;
    const devMember = await prisma.projectMember.findFirst({
      where: { projectId, role: "DEV" },
    });
    if (!devMember) return { error: "Нет разработчиков в проекте" };
    devUserId = devMember.userId;
  }

  const devStart = new Date(startDateISO);
  const devAssignment = await prisma.ticketAssignment.create({
    data: {
      ticketId,
      userId: devUserId,
      startDate: devStart,
      durationDays: devDays,
      type: "DEV",
    },
  });

  if (qaUserId) {
    const devTimeOffs = await getUserTimeOffSet(devUserId);
    const devCalSpan = workingDaysToCalendarSpan(devStart, devDays, devTimeOffs);
    const qaStart = addDays(devStart, devCalSpan);
    await prisma.ticketAssignment.create({
      data: {
        ticketId,
        userId: qaUserId,
        startDate: qaStart,
        durationDays: qaDays,
        type: "QA",
        parentAssignmentId: devAssignment.id,
      },
    });
  }

  return { success: true };
}

export async function moveAssignment(
  assignmentId: string,
  projectId: string,
  newUserId: string,
  newStartDateISO: string,
) {
  await requireProjectSM(projectId);

  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id: assignmentId },
    include: { ticket: true, childAssignments: true },
  });
  if (!assignment || assignment.ticket.projectId !== projectId)
    return { error: "Назначение не найдено" };

  const oldStart = assignment.startDate.getTime();
  const newStart = new Date(newStartDateISO).getTime();
  const deltaMs = newStart - oldStart;

  await prisma.ticketAssignment.update({
    where: { id: assignmentId },
    data: { userId: newUserId, startDate: new Date(newStartDateISO) },
  });

  if (assignment.childAssignments.length > 0 && deltaMs !== 0) {
    const devTimeOffs = await getUserTimeOffSet(newUserId);
    const devCalSpan = workingDaysToCalendarSpan(
      new Date(newStartDateISO),
      assignment.durationDays,
      devTimeOffs,
    );
    const devEnd = addDays(new Date(newStartDateISO), devCalSpan);

    for (const child of assignment.childAssignments) {
      const childNewStart = new Date(child.startDate.getTime() + deltaMs);
      const effectiveStart = childNewStart < devEnd ? devEnd : childNewStart;

      await prisma.ticketAssignment.update({
        where: { id: child.id },
        data: { startDate: effectiveStart },
      });
    }
  }

  return { success: true };
}

export async function resizeAssignment(
  assignmentId: string,
  projectId: string,
  newDurationDays: number,
  newStartDateISO?: string,
) {
  await requireProjectSM(projectId);

  if (newDurationDays < 1) return { error: "Минимальная длительность — 1 день" };

  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id: assignmentId },
    include: { ticket: true, childAssignments: true },
  });
  if (!assignment || assignment.ticket.projectId !== projectId)
    return { error: "Назначение не найдено" };

  const updateData: { durationDays: number; startDate?: Date } = {
    durationDays: newDurationDays,
  };
  if (newStartDateISO) {
    updateData.startDate = new Date(newStartDateISO);
  }

  await prisma.ticketAssignment.update({
    where: { id: assignmentId },
    data: updateData,
  });

  const effectiveStart = newStartDateISO
    ? new Date(newStartDateISO)
    : assignment.startDate;
  const devTimeOffs = await getUserTimeOffSet(assignment.userId);
  const calSpan = workingDaysToCalendarSpan(effectiveStart, newDurationDays, devTimeOffs);
  const devEnd = addDays(effectiveStart, calSpan);

  for (const child of assignment.childAssignments) {
    if (child.startDate < devEnd) {
      await prisma.ticketAssignment.update({
        where: { id: child.id },
        data: { startDate: devEnd },
      });
    }
  }

  return { success: true };
}

export async function splitTicketAssignment(
  assignmentId: string,
  projectId: string,
  qaUserId: string,
  qaStartDateISO: string,
) {
  await requireProjectSM(projectId);

  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id: assignmentId },
    include: { ticket: true, childAssignments: true },
  });
  if (!assignment || assignment.ticket.projectId !== projectId)
    return { error: "Назначение не найдено" };
  if (assignment.type !== "DEV")
    return { error: "Разделить можно только Dev-блок" };
  if (assignment.childAssignments.length > 0)
    return { error: "QA-блок уже существует" };

  const totalDays = spToDurationDays(assignment.ticket.storyPoints ?? 1);
  const proportion = assignment.ticket.devEffortProportion ?? 0.5;
  const devDays = Math.max(1, Math.round(totalDays * proportion));
  const qaDays = Math.max(1, totalDays - devDays);

  await prisma.ticketAssignment.update({
    where: { id: assignmentId },
    data: { durationDays: devDays },
  });

  const qaAssignment = await prisma.ticketAssignment.create({
    data: {
      ticketId: assignment.ticketId,
      userId: qaUserId,
      startDate: new Date(qaStartDateISO),
      durationDays: qaDays,
      type: "QA",
      parentAssignmentId: assignmentId,
    },
  });

  return { success: true, qaAssignmentId: qaAssignment.id };
}

export async function deleteAssignment(
  assignmentId: string,
  projectId: string,
) {
  await requireProjectSM(projectId);

  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id: assignmentId },
    include: { ticket: true, childAssignments: true },
  });
  if (!assignment || assignment.ticket.projectId !== projectId)
    return { error: "Назначение не найдено" };

  if (assignment.childAssignments.length > 0) {
    await prisma.ticketAssignment.deleteMany({
      where: { parentAssignmentId: assignmentId },
    });
  }

  await prisma.ticketAssignment.delete({ where: { id: assignmentId } });

  return { success: true };
}
