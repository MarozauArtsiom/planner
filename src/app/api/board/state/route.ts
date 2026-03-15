import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
  const userId = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId)
    return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership)
    return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { activeSprintId: true, ownerId: true },
  });

  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, startDate: true, endDate: true },
  });

  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      role: { in: ["DEV", "QA", "BA"] },
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const roleOrder: Record<string, number> = { DEV: 0, QA: 1, BA: 2 };
  const sortedMembers = members
    .map((m) => ({ id: m.user.id, name: m.user.name, role: m.role! }))
    .sort((a, b) => {
      if (a.role === b.role) return a.name.localeCompare(b.name);
      return (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9);
    });

  const assignments = await prisma.ticketAssignment.findMany({
    where: { ticket: { projectId } },
    include: {
      ticket: {
        select: {
          id: true,
          title: true,
          externalId: true,
          storyPoints: true,
          devEffortProportion: true,
        },
      },
    },
  });

  const memberIds = sortedMembers.map((m) => m.id);

  const timeOffs =
    sprints.length > 0
      ? await prisma.timeOff.findMany({
          where: {
            userId: { in: memberIds },
            date: {
              gte: sprints[0].startDate,
              lte: sprints[sprints.length - 1].endDate,
            },
          },
          select: { userId: true, date: true },
        })
      : [];

  const allTickets = await prisma.ticket.findMany({
    where: { projectId, storyPoints: { not: null } },
    include: {
      ticketAssignments: { select: { type: true } },
    },
  });

  const backlog = allTickets.map((t) => ({
    id: t.id,
    title: t.title,
    externalId: t.externalId,
    storyPoints: t.storyPoints!,
    devEffortProportion: t.devEffortProportion ?? 0.5,
    hasDevAssignment: t.ticketAssignments.some((a) => a.type === "DEV"),
    hasQaAssignment: t.ticketAssignments.some((a) => a.type === "QA"),
    hasBaAssignment: t.ticketAssignments.some((a) => a.type === "BA"),
  }));

  return NextResponse.json({
    sprints: sprints.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
    })),
    members: sortedMembers,
    assignments: assignments.map((a) => ({
      id: a.id,
      ticketId: a.ticket.id,
      ticketTitle: a.ticket.title,
      ticketExternalId: a.ticket.externalId,
      storyPoints: a.ticket.storyPoints ?? 1,
      devEffortProportion: a.ticket.devEffortProportion ?? 0.5,
      userId: a.userId,
      startDate: a.startDate.toISOString(),
      durationDays: a.durationDays,
      type: a.type,
      parentAssignmentId: a.parentAssignmentId,
    })),
    backlog,
    timeOffs: timeOffs.map((t) => ({
      userId: t.userId,
      date: t.date.toISOString(),
    })),
    activeSprintId: project?.activeSprintId ?? null,
    currentUser: { id: user.id, role: membership.role, isScrumMaster: hasSmRights(userId, membership, project) },
  });
  } catch (e) {
    console.error("[GET /api/board/state] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
