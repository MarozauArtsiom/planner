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

  let submittedCount = 0;
  let currentUserVoted = false;
  let results = null;

  if (session?.activeTicketId) {
    const votes = await prisma.vote.findMany({
      where: { ticketId: session.activeTicketId },
    });

    submittedCount = votes.length;
    currentUserVoted = votes.some((v) => v.userId === userId);

    if (session.status === "REVEALED") {
      const calc = calculateEstimation(votes);
      results = { ...calc, voteCount: votes.length };
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
    tickets,
    currentUser: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  });
}
