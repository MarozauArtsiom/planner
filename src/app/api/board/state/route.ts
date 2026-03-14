import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, startDate: true, endDate: true },
  });

  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      user: { role: { in: ["DEV", "QA"] } },
    },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { user: { role: "asc" } },
  });

  const sortedMembers = members
    .map((m) => m.user)
    .sort((a, b) => {
      if (a.role === b.role) return a.name.localeCompare(b.name);
      return a.role === "DEV" ? -1 : 1;
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
    currentUser: { id: user.id, role: user.role },
  });
}
