import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { RetroHubClient } from "./retro-hub-client";

export default async function RetroHubPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/retro");
  }
  if (user.isGuest) {
    redirect("/poker");
  }

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id, project: { isQuick: false } },
    include: {
      project: {
        include: {
          sprints: {
            select: { id: true, name: true },
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const projectIds = memberships.map((m) => m.project.id);

  const boards = await prisma.retroBoard.findMany({
    where: {
      OR: [
        { projectId: { in: projectIds } },
        { createdById: user.id },
        { participants: { some: { userId: user.id } } },
      ],
    },
    include: {
      project: { select: { id: true, name: true, ownerId: true } },
      sprint: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: {
        select: { cards: true, actionItems: true, participants: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const openActionItems = await prisma.retroActionItem.findMany({
    where: {
      projectId: { in: projectIds },
      status: "OPEN",
    },
    include: {
      project: { select: { id: true, name: true } },
      board: { select: { id: true, title: true, inviteToken: true } },
      assignee: { select: { id: true, name: true } },
      ticket: { select: { id: true, title: true, storyPoints: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const smProjectIds = new Set(
    memberships
      .filter((m) => m.isScrumMaster || m.project.ownerId === user.id)
      .map((m) => m.project.id),
  );

  return (
    <RetroHubClient
      user={{ id: user.id, name: user.name }}
      projects={memberships.map((m) => ({
        id: m.project.id,
        name: m.project.name,
        activeSprintId: m.project.activeSprintId,
        sprints: m.project.sprints,
      }))}
      boards={boards.map((b) => ({
        id: b.id,
        title: b.title,
        inviteToken: b.inviteToken,
        template: b.template,
        phase: b.phase,
        projectId: b.projectId,
        projectName: b.project.name,
        sprintName: b.sprint?.name ?? null,
        createdByName: b.createdBy.name,
        createdById: b.createdById,
        canDelete:
          b.createdById === user.id || smProjectIds.has(b.projectId),
        createdAt: b.createdAt.toISOString(),
        cardsCount: b._count.cards,
        actionItemsCount: b._count.actionItems,
      }))}
      openActionItems={openActionItems.map((a) => ({
        id: a.id,
        title: a.title,
        projectId: a.projectId,
        projectName: a.project.name,
        boardTitle: a.board.title,
        boardInviteToken: a.board.inviteToken,
        assigneeName: a.assignee?.name ?? null,
        dueDate: a.dueDate ? a.dueDate.toISOString().slice(0, 10) : null,
        convertedTicketId: a.ticketId,
        convertedTicketSp: a.ticket?.storyPoints ?? null,
      }))}
    />
  );
}
