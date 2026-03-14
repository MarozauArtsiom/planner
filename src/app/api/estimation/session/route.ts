import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { calculateEstimation } from "@/lib/estimation-engine";

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

  const session = await prisma.estimationSession.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: { activeTicket: true },
  });

  const totalVoters = await prisma.projectMember.count({
    where: {
      projectId,
      user: { role: { in: ["DEV", "QA"] } },
    },
  });

  const isSM = user.isScrumMaster || membership.isScrumMaster;

  let submittedCount = 0;
  let currentUserVoted = false;
  let results = null;
  let individualVotes = null;
  let voterStatus = null;

  if (session?.activeTicketId) {
    const votes = await prisma.vote.findMany({
      where: { ticketId: session.activeTicketId },
      include: { user: { select: { id: true, name: true } } },
    });

    submittedCount = votes.length;
    currentUserVoted = votes.some((v) => v.userId === userId);

    if (session.status === "VOTING" && isSM) {
      const teamMembers = await prisma.projectMember.findMany({
        where: { projectId, user: { role: { in: ["DEV", "QA"] } } },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { user: { name: "asc" } },
      });
      const votedIds = new Set(votes.map((v) => v.userId));
      voterStatus = teamMembers.map((m) => ({
        oderId: m.user.id,
        name: m.user.name,
        voted: votedIds.has(m.user.id),
      }));
    }

    if (session.status === "REVEALED") {
      const calc = calculateEstimation(votes);
      results = { ...calc, voteCount: votes.length };
      individualVotes = votes.map((v) => ({
        oderId: v.user.id,
        name: v.user.name,
        devEffort: v.devEffort,
        qaEffort: v.qaEffort,
        risk: v.risk,
        uncertainty: v.uncertainty,
        totalScore: v.devEffort + v.qaEffort + v.risk + v.uncertainty,
      }));
    }
  }

  let tickets: {
    id: string;
    externalId: string | null;
    title: string;
    storyPoints: number | null;
    isActive: boolean;
  }[] = [];

  const allTickets = await prisma.ticket.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  tickets = allTickets.map((t) => ({
    id: t.id,
    externalId: t.externalId,
    title: t.title,
    storyPoints: t.storyPoints,
    isActive: session?.activeTicketId === t.id,
  }));

  return NextResponse.json({
    sessionId: session?.id ?? null,
    status: session?.activeTicketId ? session.status : "IDLE",
    activeTicket: session?.activeTicket
      ? {
          id: session.activeTicket.id,
          externalId: session.activeTicket.externalId,
          externalUrl: session.activeTicket.externalUrl,
          title: session.activeTicket.title,
          description: session.activeTicket.description,
          acceptanceCriteria: session.activeTicket.acceptanceCriteria,
        }
      : null,
    votes: {
      totalVoters,
      submittedCount,
      currentUserVoted,
    },
    results,
    individualVotes,
    voterStatus,
    tickets,
    currentUser: {
      id: user.id,
      name: user.name,
      role: user.role,
      isScrumMaster: isSM,
    },
  });
}
