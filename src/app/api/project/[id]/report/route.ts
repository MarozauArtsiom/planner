import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { ReportData } from "@/lib/report/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership)
    return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const sprintIdsParam = request.nextUrl.searchParams.get("sprintIds");
  if (!sprintIdsParam)
    return NextResponse.json(
      { error: "sprintIds required" },
      { status: 400 },
    );

  const sprintIds = sprintIdsParam.split(",").filter(Boolean);

  const sprints = await prisma.sprint.findMany({
    where: { id: { in: sprintIds }, projectId },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, startDate: true, endDate: true },
  });

  if (sprints.length === 0)
    return NextResponse.json({ error: "No sprints found" }, { status: 404 });

  const members = await prisma.projectMember.findMany({
    where: { projectId, role: { in: ["DEV", "QA", "BA"] } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const roleOrder: Record<string, number> = { DEV: 0, QA: 1, BA: 2 };
  const sortedMembers = members
    .map((m) => ({ id: m.user.id, name: m.user.name, role: m.role as "DEV" | "QA" | "BA" }))
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
          externalUrl: true,
          storyPoints: true,
        },
      },
    },
  });

  const memberIds = sortedMembers.map((m) => m.id);
  const dateRange = {
    gte: sprints[0].startDate,
    lte: sprints[sprints.length - 1].endDate,
  };

  const timeOffs = await prisma.timeOff.findMany({
    where: { userId: { in: memberIds }, date: dateRange },
    select: { userId: true, date: true },
  });

  const allTickets = await prisma.ticket.findMany({
    where: { projectId, storyPoints: { not: null } },
    include: { ticketAssignments: { select: { type: true } } },
  });

  const backlog = allTickets.map((t) => ({
    id: t.id,
    title: t.title,
    externalId: t.externalId,
    externalUrl: t.externalUrl,
    storyPoints: t.storyPoints!,
    hasDevAssignment: t.ticketAssignments.some((a) => a.type === "DEV"),
    hasQaAssignment: t.ticketAssignments.some((a) => a.type === "QA"),
    hasBaAssignment: t.ticketAssignments.some((a) => a.type === "BA"),
  }));

  const data: ReportData = {
    projectName: project.name,
    generatedAt: new Date().toISOString(),
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
      ticketExternalUrl: a.ticket.externalUrl,
      storyPoints: a.ticket.storyPoints ?? 1,
      userId: a.userId,
      startDate: a.startDate.toISOString(),
      durationDays: a.durationDays,
      type: a.type as "DEV" | "QA" | "BA",
      parentAssignmentId: a.parentAssignmentId,
    })),
    timeOffs: timeOffs.map((t) => ({
      userId: t.userId,
      date: t.date.toISOString(),
    })),
    backlog,
  };

  return NextResponse.json(data);
}
