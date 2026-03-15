"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  if (!hasSmRights(user, membership))
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

const VALID_DEV_EFFORT = [1, 2, 4, 6];
const VALID_QA_EFFORT = [1, 2, 4];
const VALID_RISK = [0, 1, 2];
const VALID_UNCERTAINTY = [0, 1, 2];

export async function submitVote(projectId: string, formData: FormData) {
  const t = await getTranslations("errors");
  const { user, membership } = await requireProjectMember(projectId);
  if (!membership.role) {
    return { error: t("onlyTeamCanVote") };
  }

  const session = await getActiveSession(projectId);
  if (!session || session.status !== "VOTING" || !session.activeTicketId) {
    return { error: t("votingNotActive") };
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
    return { error: t("invalidCriteriaValues") };
  }

  await prisma.vote.upsert({
    where: { userId_ticketId: { userId: user.id, ticketId: session.activeTicketId } },
    create: { userId: user.id, ticketId: session.activeTicketId, devEffort, qaEffort, risk, uncertainty },
    update: { devEffort, qaEffort, risk, uncertainty },
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

  const votes = await prisma.vote.findMany({
    where: { ticketId: session.activeTicketId },
  });

  const spScaleItems = await prisma.spScaleItem.findMany({
    where: { projectId },
    select: { value: true },
  });
  const spValues = spScaleItems.map((s) => s.value);
  const result = calculateEstimation(votes, spValues.length > 0 ? spValues : undefined);
  const sp = overrideSp && overrideSp > 0 ? overrideSp : result.recommendedSp;

  await prisma.ticket.update({
    where: { id: session.activeTicketId },
    data: { storyPoints: sp, devEffortProportion: result.devProportion },
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
