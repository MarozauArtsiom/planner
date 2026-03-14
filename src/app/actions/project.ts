"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";

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
