"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import { calculateEstimation } from "@/lib/estimation-engine";

async function requireUser() {
  const userId = await getSession();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  return user;
}

async function requireProjectMember(projectId: string) {
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership) throw new Error("Нет доступа к проекту");
  return { user, membership };
}

async function requireProjectSM(projectId: string) {
  const { user, membership } = await requireProjectMember(projectId);
  if (!hasSmRights(user, membership))
    throw new Error("Только Scrum Master может выполнять это действие");
  return user;
}

async function getActiveSession(projectId: string) {
  return prisma.estimationSession.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

async function ensureSession(projectId: string) {
  const existing = await getActiveSession(projectId);
  if (existing) return existing;

  return prisma.estimationSession.create({
    data: { status: "VOTING", projectId },
  });
}

export async function createTicket(projectId: string, formData: FormData) {
  await requireProjectSM(projectId);

  const title = (formData.get("title") as string)?.trim();
  const externalId = (formData.get("externalId") as string)?.trim() || null;
  const externalUrl = (formData.get("externalUrl") as string)?.trim() || null;
  const description =
    (formData.get("description") as string)?.trim() || null;
  const acceptanceCriteria =
    (formData.get("acceptanceCriteria") as string)?.trim() || null;

  if (!title) return { error: "Название тикета обязательно" };

  await prisma.ticket.create({
    data: {
      title,
      externalId,
      externalUrl,
      description,
      acceptanceCriteria,
      projectId,
    },
  });

  return { success: true };
}

export async function setActiveTicket(projectId: string, ticketId: string) {
  await requireProjectSM(projectId);
  const session = await ensureSession(projectId);

  await prisma.vote.deleteMany({ where: { ticketId } });

  await prisma.estimationSession.update({
    where: { id: session.id },
    data: { activeTicketId: ticketId, status: "VOTING" },
  });

  return { success: true };
}

const VALID_DEV_EFFORT = [1, 2, 4, 6];
const VALID_QA_EFFORT = [1, 2, 4];
const VALID_RISK = [0, 1, 2];
const VALID_UNCERTAINTY = [0, 1, 2];

export async function submitVote(projectId: string, formData: FormData) {
  const { user, membership } = await requireProjectMember(projectId);
  if (!membership.role) {
    return { error: "Только участники команды (DEV/QA) могут голосовать" };
  }

  const session = await getActiveSession(projectId);
  if (!session || session.status !== "VOTING" || !session.activeTicketId) {
    return { error: "Голосование не активно" };
  }

  const devEffort = parseInt(formData.get("devEffort") as string);
  const qaEffort = parseInt(formData.get("qaEffort") as string);
  const risk = parseInt(formData.get("risk") as string);
  const uncertainty = parseInt(formData.get("uncertainty") as string);

  if (
    !VALID_DEV_EFFORT.includes(devEffort) ||
    !VALID_QA_EFFORT.includes(qaEffort) ||
    !VALID_RISK.includes(risk) ||
    !VALID_UNCERTAINTY.includes(uncertainty)
  ) {
    return { error: "Некорректные значения критериев" };
  }

  await prisma.vote.upsert({
    where: {
      userId_ticketId: {
        userId: user.id,
        ticketId: session.activeTicketId,
      },
    },
    create: {
      userId: user.id,
      ticketId: session.activeTicketId,
      devEffort,
      qaEffort,
      risk,
      uncertainty,
    },
    update: { devEffort, qaEffort, risk, uncertainty },
  });

  return { success: true };
}

export async function revealVotes(projectId: string) {
  await requireProjectSM(projectId);
  const session = await getActiveSession(projectId);

  if (!session || session.status !== "VOTING" || !session.activeTicketId) {
    return { error: "Нет активного голосования" };
  }

  await prisma.estimationSession.update({
    where: { id: session.id },
    data: { status: "REVEALED" },
  });

  return { success: true };
}

export async function acceptEstimation(projectId: string, overrideSp?: number) {
  await requireProjectSM(projectId);
  const session = await getActiveSession(projectId);

  if (!session || session.status !== "REVEALED" || !session.activeTicketId) {
    return { error: "Нечего принимать" };
  }

  const votes = await prisma.vote.findMany({
    where: { ticketId: session.activeTicketId },
  });

  const result = calculateEstimation(votes);
  const sp = overrideSp && overrideSp > 0 ? overrideSp : result.recommendedSp;

  await prisma.ticket.update({
    where: { id: session.activeTicketId },
    data: {
      storyPoints: sp,
      devEffortProportion: result.devProportion,
    },
  });

  await prisma.estimationSession.update({
    where: { id: session.id },
    data: { activeTicketId: null, status: "VOTING" },
  });

  return { success: true };
}

export async function restartVoting(projectId: string) {
  await requireProjectSM(projectId);
  const session = await getActiveSession(projectId);

  if (!session || !session.activeTicketId) {
    return { error: "Нет активного тикета" };
  }

  await prisma.vote.deleteMany({
    where: { ticketId: session.activeTicketId },
  });

  await prisma.estimationSession.update({
    where: { id: session.id },
    data: { status: "VOTING" },
  });

  return { success: true };
}

export async function deleteTicket(projectId: string, ticketId: string) {
  await requireProjectSM(projectId);

  const session = await prisma.estimationSession.findFirst({
    where: { activeTicketId: ticketId },
  });
  if (session) {
    return { error: "Нельзя удалить активный тикет" };
  }

  await prisma.ticket.delete({ where: { id: ticketId } });
  return { success: true };
}
