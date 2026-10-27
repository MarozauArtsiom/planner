"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import {
  calculateEstimation,
  calculateSimpleEstimation,
  getShapeForMethod,
  isEstimationMethod,
  parseCustomShape,
  type EstimationMethod,
} from "@/lib/estimation-engine";
import { DEFAULT_SP_SCALE } from "@/lib/sp-scale";

async function requireUser() {
  const userId = await getSession();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  return user;
}

async function requireProjectMember(projectId: string) {
  const t = await getTranslations("errors");
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership) throw new Error(t("noProjectAccess"));
  return { user, membership };
}

async function requireProjectSM(projectId: string) {
  const t = await getTranslations("errors");
  const { user, membership } = await requireProjectMember(projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, isQuick: true },
  });
  // В Quick-комнате SM-логика заменяется на проверку owner — только хост управляет
  if (project?.isQuick) {
    if (project.ownerId !== user.id) throw new Error(t("onlyHostAction"));
    return user;
  }
  if (!hasSmRights(user.id, membership, project))
    throw new Error(t("onlySmAction"));
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
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);

  const title = (formData.get("title") as string)?.trim();
  const externalId = (formData.get("externalId") as string)?.trim() || null;
  const externalUrl = (formData.get("externalUrl") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const acceptanceCriteria = (formData.get("acceptanceCriteria") as string)?.trim() || null;

  if (!title) return { error: t("ticketTitleRequired") };

  await prisma.ticket.create({
    data: { title, externalId, externalUrl, description, acceptanceCriteria, projectId },
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

const VALID_DEV_EFFORT = [0, 1, 2, 4, 6];
const VALID_QA_EFFORT = [0, 1, 2, 4];
const VALID_RISK = [0, 1, 2, 3];
const VALID_UNCERTAINTY = [0, 1, 2, 3];

async function getProjectMethod(projectId: string): Promise<EstimationMethod> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { estimationMethod: true },
  });
  return isEstimationMethod(project?.estimationMethod)
    ? project.estimationMethod
    : "COMPOSITE_SP";
}

export async function submitVote(projectId: string, formData: FormData) {
  const t = await getTranslations("errors");
  const { user, membership } = await requireProjectMember(projectId);
  // В обычных проектах голосуют только участники с ролью DEV/QA/BA;
  // в Quick-комнатах любой member может голосовать (роли не используются).
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      isQuick: true,
      customShapeJson: true,
      spScaleItems: { select: { value: true } },
    },
  });
  if (!project?.isQuick && !membership.role) {
    return { error: t("onlyTeamCanVote") };
  }

  const session = await getActiveSession(projectId);
  if (!session || session.status !== "VOTING" || !session.activeTicketId) {
    return { error: t("votingNotActive") };
  }

  const method = await getProjectMethod(projectId);

  if (method === "COMPOSITE_SP") {
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
      return { error: t("invalidCriteriaValues") };
    }

    await prisma.vote.upsert({
      where: { userId_ticketId: { userId: user.id, ticketId: session.activeTicketId } },
      create: {
        userId: user.id,
        ticketId: session.activeTicketId,
        devEffort,
        qaEffort,
        risk,
        uncertainty,
        singleValue: null,
      },
      update: { devEffort, qaEffort, risk, uncertainty, singleValue: null },
    });

    return { success: true };
  }

  // Single-value методы: FIBONACCI_SP / HOURS / DAYS
  const raw = formData.get("singleValue") as string | null;
  const singleValue = raw != null ? parseFloat(raw) : NaN;
  if (!Number.isFinite(singleValue) || singleValue < 0) {
    return { error: t("invalidCriteriaValues") };
  }
  const customValues = [
    ...parseCustomShape(project?.customShapeJson),
    ...(method === "FIBONACCI_SP"
      ? (project?.spScaleItems.map((s) => s.value) ?? [])
      : []),
  ];
  const shape = getShapeForMethod(method, customValues);
  if (shape.length > 0 && !shape.includes(singleValue)) {
    return { error: t("invalidCriteriaValues") };
  }

  await prisma.vote.upsert({
    where: { userId_ticketId: { userId: user.id, ticketId: session.activeTicketId } },
    create: {
      userId: user.id,
      ticketId: session.activeTicketId,
      devEffort: null,
      qaEffort: null,
      risk: null,
      uncertainty: null,
      singleValue,
    },
    update: {
      devEffort: null,
      qaEffort: null,
      risk: null,
      uncertainty: null,
      singleValue,
    },
  });

  return { success: true };
}

export async function revealVotes(projectId: string) {
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);
  const session = await getActiveSession(projectId);

  if (!session || session.status !== "VOTING" || !session.activeTicketId) {
    return { error: t("noActiveVoting") };
  }

  await prisma.estimationSession.update({
    where: { id: session.id },
    data: { status: "REVEALED" },
  });

  return { success: true };
}

export async function acceptEstimation(projectId: string, overrideSp?: number) {
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);
  const session = await getActiveSession(projectId);

  if (!session || session.status !== "REVEALED" || !session.activeTicketId) {
    return { error: t("nothingToAccept") };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      estimationMethod: true,
      workingHoursPerDay: true,
      customShapeJson: true,
    },
  });
  const method: EstimationMethod = isEstimationMethod(project?.estimationMethod)
    ? project.estimationMethod
    : "COMPOSITE_SP";
  const workingHoursPerDay = project?.workingHoursPerDay ?? 8;
  const customValues = parseCustomShape(project?.customShapeJson);

  const votes = await prisma.vote.findMany({
    where: { ticketId: session.activeTicketId },
  });

  const spScaleItems = await prisma.spScaleItem.findMany({
    where: { projectId },
    select: { value: true, label: true, durationDays: true },
  });

  let sp: number;
  let devProportion: number | null = null;

  if (method === "COMPOSITE_SP") {
    const compositeVotes = votes
      .filter(
        (v) =>
          v.devEffort != null &&
          v.qaEffort != null &&
          v.risk != null &&
          v.uncertainty != null,
      )
      .map((v) => ({
        devEffort: v.devEffort as number,
        qaEffort: v.qaEffort as number,
        risk: v.risk as number,
        uncertainty: v.uncertainty as number,
      }));
    const spValues = Array.from(
      new Set([
        ...spScaleItems.map((s) => s.value),
        ...customValues.filter((v) => Number.isInteger(v)),
      ]),
    );
    const result = calculateEstimation(
      compositeVotes,
      spValues.length > 0 ? spValues : undefined,
    );
    sp = overrideSp != null && overrideSp >= 0 ? overrideSp : result.recommendedSp;
    devProportion = result.devProportion;
  } else {
    const simpleVotes = votes
      .filter((v) => v.singleValue != null)
      .map((v) => ({ value: v.singleValue as number }));
    const result = calculateSimpleEstimation(
      simpleVotes,
      method,
      spScaleItems,
      workingHoursPerDay,
      customValues,
    );
    sp = overrideSp != null && overrideSp >= 0 ? overrideSp : result.recommendedSp;
  }

  await prisma.ticket.update({
    where: { id: session.activeTicketId },
    data: {
      storyPoints: Math.round(sp),
      ...(devProportion != null && { devEffortProportion: devProportion }),
    },
  });

  await prisma.estimationSession.update({
    where: { id: session.id },
    data: { activeTicketId: null, status: "VOTING" },
  });

  return { success: true };
}

export async function restartVoting(projectId: string) {
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);
  const session = await getActiveSession(projectId);

  if (!session || !session.activeTicketId) {
    return { error: t("noActiveTicket") };
  }

  await prisma.vote.deleteMany({ where: { ticketId: session.activeTicketId } });
  await prisma.estimationSession.update({
    where: { id: session.id },
    data: { status: "VOTING" },
  });

  return { success: true };
}

export interface TicketImportInput {
  externalId: string | null;
  title: string;
  externalUrl: string | null;
  description: string | null;
  acceptanceCriteria: string | null;
}

export async function importTickets(projectId: string, tickets: TicketImportInput[]) {
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);

  if (!tickets.length) return { error: t("noTicketsToImport") };

  const valid = tickets.filter((tk) => tk.title?.trim());
  if (!valid.length) return { error: t("noTicketsWithTitle") };

  await prisma.ticket.createMany({
    data: valid.map((tk) => ({
      title: tk.title.trim(),
      externalId: tk.externalId?.trim() || null,
      externalUrl: tk.externalUrl?.trim() || null,
      description: tk.description?.trim() || null,
      acceptanceCriteria: tk.acceptanceCriteria?.trim() || null,
      projectId,
    })),
  });

  return { success: true, count: valid.length };
}

/** Тоггл «Показывать гистограмму распределения всем участникам». Доступно SM/host. */
export async function setShowDistribution(projectId: string, show: boolean) {
  await requireProjectSM(projectId);
  await prisma.project.update({
    where: { id: projectId },
    data: { showDistributionToAll: show },
  });
  return { success: true };
}

export async function deleteTicket(projectId: string, ticketId: string) {
  const t = await getTranslations("errors");
  await requireProjectSM(projectId);

  const session = await prisma.estimationSession.findFirst({
    where: { activeTicketId: ticketId },
  });
  if (session) {
    return { error: t("cannotDeleteActiveTicket") };
  }

  await prisma.ticket.delete({ where: { id: ticketId } });
  return { success: true };
}

/**
 * Добавить своё значение оценки в комнату / проект.
 * Доступно любому участнику комнаты, чтобы он мог вставить новую оценку
 * и все участники комнаты сразу увидели её и могли проголосовать.
 */
export async function addCustomEstimationValue(
  projectId: string,
  rawValue: number,
  label?: string,
) {
  const t = await getTranslations("errors");
  await requireProjectMember(projectId);

  const value = Math.round(Number(rawValue) * 100) / 100;
  if (!Number.isFinite(value) || value < 0 || value > 10000) {
    return { error: t("invalidCriteriaValues") };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      isQuick: true,
      estimationMethod: true,
      customShapeJson: true,
    },
  });
  if (!project) return { error: t("noProjectAccess") };

  const currentCustom = parseCustomShape(project.customShapeJson);
  const nextCustom = Array.from(new Set([...currentCustom, value])).sort(
    (a, b) => a - b,
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { customShapeJson: JSON.stringify(nextCustom) },
  });

  if (!project.isQuick && Number.isInteger(value) && value >= 0) {
    const existing = await prisma.spScaleItem.findUnique({
      where: { projectId_value: { projectId, value } },
    });
    if (!existing) {
      await prisma.spScaleItem.create({
        data: {
          projectId,
          value,
          label: label?.trim() || `${value} SP`,
          durationDays: Math.max(1, Math.min(30, value || 1)),
        },
      });
    }
  }

  const method: EstimationMethod = isEstimationMethod(project.estimationMethod)
    ? project.estimationMethod
    : "COMPOSITE_SP";

  return {
    success: true,
    value,
    customValues: nextCustom,
    shape: getShapeForMethod(method, nextCustom),
  };
}

/**
 * Удалить пользовательское значение оценки из комнаты / проекта.
 */
export async function removeCustomEstimationValue(
  projectId: string,
  rawValue: number,
) {
  const t = await getTranslations("errors");
  await requireProjectMember(projectId);

  const value = Math.round(Number(rawValue) * 100) / 100;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      isQuick: true,
      estimationMethod: true,
      customShapeJson: true,
    },
  });
  if (!project) return { error: t("noProjectAccess") };

  const currentCustom = parseCustomShape(project.customShapeJson);
  const nextCustom = currentCustom.filter((v) => v !== value);

  await prisma.project.update({
    where: { id: projectId },
    data: {
      customShapeJson: nextCustom.length > 0 ? JSON.stringify(nextCustom) : null,
    },
  });

  const isDefaultSp = DEFAULT_SP_SCALE.some((s) => s.value === value);
  if (!project.isQuick && Number.isInteger(value) && !isDefaultSp) {
    const totalScaleCount = await prisma.spScaleItem.count({
      where: { projectId },
    });
    if (totalScaleCount > 1) {
      await prisma.spScaleItem.deleteMany({
        where: { projectId, value },
      });
    }
  }

  const method: EstimationMethod = isEstimationMethod(project.estimationMethod)
    ? project.estimationMethod
    : "COMPOSITE_SP";

  return {
    success: true,
    customValues: nextCustom,
    shape: getShapeForMethod(method, nextCustom),
  };
}
