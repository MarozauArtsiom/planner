import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { ProjectRetroClient } from "./project-retro-client";

export default async function ProjectRetroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.isGuest) redirect("/poker");

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
  });
  if (!membership) redirect("/");

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sprints: {
        select: { id: true, name: true },
        orderBy: { startDate: "desc" },
      },
      retroBoards: {
        include: {
          sprint: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          _count: {
            select: { cards: true, actionItems: true, participants: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      retroActionItems: {
        include: {
          assignee: { select: { id: true, name: true } },
          board: { select: { id: true, title: true, inviteToken: true } },
          ticket: {
            select: { id: true, title: true, storyPoints: true },
          },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!project) redirect("/");

  const hasSmRights = membership.isScrumMaster || project.ownerId === user.id;

  return (
    <ProjectRetroClient
      project={{
        id: project.id,
        name: project.name,
        activeSprintId: project.activeSprintId,
        sprints: project.sprints,
      }}
      boards={project.retroBoards.map((b) => ({
        id: b.id,
        title: b.title,
        inviteToken: b.inviteToken,
        template: b.template,
        phase: b.phase,
        sprintName: b.sprint?.name ?? null,
        createdByName: b.createdBy.name,
        createdById: b.createdById,
        createdAt: b.createdAt.toISOString(),
        cardsCount: b._count.cards,
        actionItemsCount: b._count.actionItems,
        participantsCount: b._count.participants,
      }))}
      actionItems={project.retroActionItems.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        assigneeName: a.assignee?.name ?? null,
        dueDate: a.dueDate ? a.dueDate.toISOString().slice(0, 10) : null,
        boardTitle: a.board.title,
        boardInviteToken: a.board.inviteToken,
        convertedTicketId: a.ticketId,
        convertedTicketTitle: a.ticket?.title ?? null,
        convertedTicketSp: a.ticket?.storyPoints ?? null,
      }))}
      user={{
        id: user.id,
        name: user.name,
        role: membership.role,
        hasSmRights,
        isScrumMaster: membership.isScrumMaster,
      }}
    />
  );
}
