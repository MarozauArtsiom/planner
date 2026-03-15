"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import { DEFAULT_SP_SCALE, type SpScaleEntry } from "@/lib/sp-scale";
import { recalcFutureSprints } from "@/app/actions/sprint";

const VALID_ROLES = ["DEV", "QA"] as const;

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

export async function createProject(formData: FormData) {
  const user = await requireUser();
  if (!user.isScrumMaster) {
    return { error: "Только Scrum Master может создавать проекты" };
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Название проекта обязательно" };

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
  const user = await requireUser();

  const link = await prisma.inviteLink.findUnique({
    where: { token: inviteToken },
    include: { project: true },
  });
  if (!link) return { error: "Ссылка недействительна" };

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
  const user = await requireUser();

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership || !hasSmRights(user, membership)) {
    return { error: "Только Scrum Master может создавать ссылки" };
  }

  const link = await prisma.inviteLink.create({
    data: {
      projectId,
      grantsSm,
      label: grantsSm ? "Scrum Master" : "Участник",
    },
  });

  return { success: true, linkId: link.id };
}

export async function deleteInviteLink(linkId: string, projectId: string) {
  const user = await requireUser();

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership || !hasSmRights(user, membership)) {
    return { error: "Только Scrum Master может удалять ссылки" };
  }

  const link = await prisma.inviteLink.findUnique({ where: { id: linkId } });
  if (!link || link.projectId !== projectId) {
    return { error: "Ссылка не найдена" };
  }

  await prisma.inviteLink.delete({ where: { id: linkId } });
  return { success: true };
}

export async function toggleMemberSm(projectId: string, targetUserId: string) {
  const user = await requireUser();

  const callerMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!callerMembership || !hasSmRights(user, callerMembership)) {
    return { error: "Только Scrum Master может управлять правами" };
  }

  const targetMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: targetUserId, projectId } },
  });
  if (!targetMembership) {
    return { error: "Участник не найден" };
  }

  await prisma.projectMember.update({
    where: { id: targetMembership.id },
    data: { isScrumMaster: !targetMembership.isScrumMaster },
  });

  return { success: true, isScrumMaster: !targetMembership.isScrumMaster };
}

export async function updateMemberRole(
  projectId: string,
  targetUserId: string,
  newRole: string | null,
) {
  const user = await requireUser();

  const callerMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!callerMembership || !hasSmRights(user, callerMembership)) {
    return { error: "Только Scrum Master может менять роли" };
  }

  const targetMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: targetUserId, projectId } },
  });
  if (!targetMembership) {
    return { error: "Участник не найден" };
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
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership || !hasSmRights(user, membership)) {
    return { error: "Только Scrum Master может менять настройки" };
  }

  if (settings.sprintDurationWeeks != null) {
    if (settings.sprintDurationWeeks < 1 || settings.sprintDurationWeeks > 4) {
      return { error: "Длительность спринта: 1-4 недели" };
    }
  }
  if (settings.sprintStartDay != null) {
    if (settings.sprintStartDay < 0 || settings.sprintStartDay > 6) {
      return { error: "День старта: 0 (Вс) - 6 (Сб)" };
    }
  }
  if (settings.taskCoefficient != null) {
    if (settings.taskCoefficient < 0.1 || settings.taskCoefficient > 5.0) {
      return { error: "Коэффициент: от 0.1 до 5.0" };
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

  if (
    settings.sprintDurationWeeks != null &&
    oldProject &&
    settings.sprintDurationWeeks !== oldProject.sprintDurationWeeks
  ) {
    await recalcFutureSprints(projectId, settings.sprintDurationWeeks);
  }

  return { success: true };
}

export async function setActiveSprint(projectId: string, sprintId: string | null) {
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership || !hasSmRights(user, membership)) {
    return { error: "Только Scrum Master может менять активный спринт" };
  }

  if (sprintId) {
    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!sprint || sprint.projectId !== projectId) {
      return { error: "Спринт не найден" };
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { activeSprintId: sprintId },
  });

  return { success: true };
}

export async function updateSpScale(projectId: string, items: SpScaleEntry[]) {
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership || !hasSmRights(user, membership)) {
    return { error: "Только Scrum Master может менять шкалу SP" };
  }

  if (items.length === 0) {
    return { error: "Шкала должна содержать хотя бы одно значение" };
  }

  const values = items.map((i) => i.value);
  if (new Set(values).size !== values.length) {
    return { error: "Значения SP не должны повторяться" };
  }

  for (const item of items) {
    if (item.value < 1) return { error: "SP должно быть >= 1" };
    if (item.durationDays < 1) return { error: "Длительность должна быть >= 1 дня" };
    if (!item.label.trim()) return { error: "Описание не может быть пустым" };
  }

  await prisma.$transaction([
    prisma.spScaleItem.deleteMany({ where: { projectId } }),
    ...items.map((item) =>
      prisma.spScaleItem.create({
        data: {
          projectId,
          value: item.value,
          label: item.label.trim(),
          durationDays: item.durationDays,
        },
      }),
    ),
  ]);

  return { success: true };
}

export async function resetSpScale(projectId: string) {
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership || !hasSmRights(user, membership)) {
    return { error: "Только Scrum Master может менять шкалу SP" };
  }

  await prisma.$transaction([
    prisma.spScaleItem.deleteMany({ where: { projectId } }),
    ...DEFAULT_SP_SCALE.map((item) =>
      prisma.spScaleItem.create({
        data: {
          projectId,
          value: item.value,
          label: item.label,
          durationDays: item.durationDays,
        },
      }),
    ),
  ]);

  return { success: true };
}
