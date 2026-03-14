"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

async function requireUser() {
  const userId = await getSession();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  return user;
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "SCRUM_MASTER") {
    return { error: "Только Scrum Master может создавать проекты" };
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Название проекта обязательно" };

  const project = await prisma.project.create({
    data: {
      name,
      ownerId: user.id,
      members: { create: { userId: user.id } },
    },
  });

  redirect(`/project/${project.id}`);
}

export async function regenerateInviteToken(projectId: string) {
  const user = await requireUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project || project.ownerId !== user.id) {
    return { error: "Только владелец может обновить ссылку" };
  }

  const crypto = await import("node:crypto");
  const newToken = crypto.randomUUID();

  await prisma.project.update({
    where: { id: projectId },
    data: { inviteToken: newToken },
  });

  return { success: true };
}

export async function joinProject(inviteToken: string) {
  const user = await requireUser();

  const project = await prisma.project.findUnique({
    where: { inviteToken },
  });
  if (!project) return { error: "Ссылка недействительна" };

  const existing = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: project.id } },
  });

  if (!existing) {
    await prisma.projectMember.create({
      data: { userId: user.id, projectId: project.id },
    });
  }

  redirect(`/project/${project.id}`);
}
