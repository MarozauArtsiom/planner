"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import { DEFAULT_SP_SCALE, type SpScaleEntry } from "@/lib/sp-scale";
import { recalcFutureSprints } from "@/app/actions/sprint";

const VALID_ROLES = ["DEV", "QA", "BA"] as const;

function isValidRole(role: string): role is (typeof VALID_ROLES)[number] {
  return (VALID_ROLES as readonly string[]).includes(role);
}

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
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!membership || !hasSmRights(user.id, membership, project)) {
    throw new Error(t("onlySmAction"));
  }
  return { user, project: project! };
}

export async function createProject(formData: FormData) {
  const t = await getTranslations("errors");
  const user = await requireUser();
  if (!user.isScrumMaster) {
    return { error: t("onlySmCanCreateProjects") };
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: t("projectNameRequired") };

  const project = await prisma.project.create({
    data: {
      name,
      ownerId: user.id,
      members: { create: { userId: user.id, isScrumMaster: true, role: user.role } },
      spScaleItems: {
        create: DEFAULT_SP_SCALE.map((item) => ({
          value: item.value,
          label: item.label,
          durationDays: item.durationDays,
        })),
      },
    },
  });

  redirect(`/project/${project.id}`);
}

export async function joinProject(inviteToken: string, role: string | null) {
  const t = await getTranslations("errors");
  const user = await requireUser();

  const link = await prisma.inviteLink.findUnique({
    where: { token: inviteToken },
    include: { project: true },
  });
  if (!link) return { error: t("linkInvalid") };

  const existing = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: link.projectId } },
  });

  if (!existing) {
    const memberRole = role && isValidRole(role) ? role : null;
    await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: link.projectId,
        role: memberRole,
        isScrumMaster: link.grantsSm,
      },
    });
  }

  redirect(`/project/${link.projectId}`);
}

export async function createInviteLink(projectId: string, grantsSm: boolean) {
  const t = await getTranslations("errors");
  try {
    await requireProjectSM(projectId);
  } catch {
    return { error: t("onlySmCanCreateLinks") };
  }

  const tp = await getTranslations("projectSettings");
  const link = await prisma.inviteLink.create({
    data: {
      projectId,
      grantsSm,
      label: grantsSm ? tp("scrumMasterLabel") : tp("memberLabel"),
    },
  });

  return { success: true, linkId: link.id };
}

export async function deleteInviteLink(linkId: string, projectId: string) {
  const t = await getTranslations("errors");
  try {
    await requireProjectSM(projectId);
  } catch {
    return { error: t("onlySmCanDeleteLinks") };
  }

  const link = await prisma.inviteLink.findUnique({ where: { id: linkId } });
  if (!link || link.projectId !== projectId) {
    return { error: t("linkNotFound") };
  }

  await prisma.inviteLink.delete({ where: { id: linkId } });
  return { success: true };
}

export async function toggleMemberSm(projectId: string, targetUserId: string) {
  const t = await getTranslations("errors");
  let project: { ownerId: string };
  try {
    ({ project } = await requireProjectSM(projectId));
  } catch {
    return { error: t("onlySmCanManageRights") };
  }

  if (targetUserId === project.ownerId) {
    return { error: t("cannotChangeOwnerSm") };
  }

  const targetMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: targetUserId, projectId } },
  });
  if (!targetMembership) {
    return { error: t("memberNotFound") };
  }

  await prisma.projectMember.update({
    where: { id: targetMembership.id },
    data: { isScrumMaster: !targetMembership.isScrumMaster },
  });

  return { success: true, isScrumMaster: !targetMembership.isScrumMaster };
}

export async function updateMemberRole(projectId: string, targetUserId: string, newRole: string | null) {
  const t = await getTranslations("errors");
  try {
    await requireProjectSM(projectId);
  } catch {
    return { error: t("onlySmCanChangeRoles") };
  }

  const targetMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: targetUserId, projectId } },
  });
  if (!targetMembership) {
    return { error: t("memberNotFound") };
  }

  const role = newRole && isValidRole(newRole) ? newRole : null;

  await prisma.projectMember.update({
    where: { id: targetMembership.id },
    data: { role },
  });

  return { success: true, role };
}

export async function updateProjectSettings(
  projectId: string,
  settings: {
    sprintDurationWeeks?: number;
    sprintStartDay?: number;
    sprintNameTemplate?: string;
    taskCoefficient?: number;
  },
) {
  const t = await getTranslations("errors");
  try {
    await requireProjectSM(projectId);
  } catch {
    return { error: t("onlySmCanChangeSettings") };
  }

  if (settings.sprintDurationWeeks != null) {
    if (settings.sprintDurationWeeks < 1 || settings.sprintDurationWeeks > 4) {
      return { error: t("sprintDurationRange") };
    }
  }
  if (settings.sprintStartDay != null) {
    if (settings.sprintStartDay < 0 || settings.sprintStartDay > 6) {
      return { error: t("startDayRange") };
    }
  }
  if (settings.taskCoefficient != null) {
    if (settings.taskCoefficient < 0.1 || settings.taskCoefficient > 5.0) {
      return { error: t("coefficientRange") };
    }
  }

  const oldProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { sprintDurationWeeks: true },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(settings.sprintDurationWeeks != null && { sprintDurationWeeks: settings.sprintDurationWeeks }),
      ...(settings.sprintStartDay != null && { sprintStartDay: settings.sprintStartDay }),
      ...(settings.sprintNameTemplate != null && { sprintNameTemplate: settings.sprintNameTemplate }),
      ...(settings.taskCoefficient != null && { taskCoefficient: Math.round(settings.taskCoefficient * 100) / 100 }),
    },
  });

  if (settings.sprintDurationWeeks != null && oldProject && settings.sprintDurationWeeks !== oldProject.sprintDurationWeeks) {
    await recalcFutureSprints(projectId, settings.sprintDurationWeeks);
  }

  return { success: true };
}

export async function setActiveSprint(projectId: string, sprintId: string | null) {
  const t = await getTranslations("errors");
  try {
    await requireProjectSM(projectId);
  } catch {
    return { error: t("onlySmCanChangeActiveSprint") };
  }

  if (sprintId) {
    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!sprint || sprint.projectId !== projectId) {
      return { error: t("sprintNotFound") };
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { activeSprintId: sprintId },
  });

  return { success: true };
}

export async function updateSpScale(projectId: string, items: SpScaleEntry[]) {
  const t = await getTranslations("errors");
  try {
    await requireProjectSM(projectId);
  } catch {
    return { error: t("onlySmCanChangeSpScale") };
  }

  if (items.length === 0) return { error: t("scaleMinOne") };

  const values = items.map((i) => i.value);
  if (new Set(values).size !== values.length) return { error: t("spValuesDuplicate") };

  for (const item of items) {
    if (item.value < 1) return { error: t("spMinOne") };
    if (item.durationDays < 1) return { error: t("durationMinOne") };
    if (!item.label.trim()) return { error: t("descriptionRequired") };
  }

  await prisma.$transaction([
    prisma.spScaleItem.deleteMany({ where: { projectId } }),
    ...items.map((item) =>
      prisma.spScaleItem.create({
        data: { projectId, value: item.value, label: item.label.trim(), durationDays: item.durationDays },
      }),
    ),
  ]);

  return { success: true };
}

export async function resetSpScale(projectId: string) {
  const t = await getTranslations("errors");
  try {
    await requireProjectSM(projectId);
  } catch {
    return { error: t("onlySmCanChangeSpScale") };
  }

  await prisma.$transaction([
    prisma.spScaleItem.deleteMany({ where: { projectId } }),
    ...DEFAULT_SP_SCALE.map((item) =>
      prisma.spScaleItem.create({
        data: { projectId, value: item.value, label: item.label, durationDays: item.durationDays },
      }),
    ),
  ]);

  return { success: true };
}
