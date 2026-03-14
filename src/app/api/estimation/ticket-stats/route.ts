import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { calculateEstimation } from "@/lib/estimation-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticketId = request.nextUrl.searchParams.get("ticketId");
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!ticketId || !projectId)
    return NextResponse.json({ error: "ticketId and projectId required" }, { status: 400 });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership)
    return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, title: true, externalId: true, storyPoints: true, projectId: true },
  });
  if (!ticket || ticket.projectId !== projectId)
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const votes = await prisma.vote.findMany({
    where: { ticketId },
    include: { user: { select: { id: true, name: true } } },
  });

  const results = votes.length > 0
    ? { ...calculateEstimation(votes), voteCount: votes.length }
    : null;

  const individualVotes = votes.map((v) => ({
    oderId: v.user.id,
    name: v.user.name,
    devEffort: v.devEffort,
    qaEffort: v.qaEffort,
    risk: v.risk,
    uncertainty: v.uncertainty,
    totalScore: v.devEffort + v.qaEffort + v.risk + v.uncertainty,
  }));

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      title: ticket.title,
      externalId: ticket.externalId,
      storyPoints: ticket.storyPoints,
    },
    results,
    individualVotes,
  });
}
