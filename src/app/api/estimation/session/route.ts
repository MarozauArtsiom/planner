import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";
import {
  calculateEstimation,
  calculateSimpleEstimation,
  getShapeForMethod,
  isEstimationMethod,
  parseCustomShape,
  type EstimationMethod,
} from "@/lib/estimation-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSession();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId)
      return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const [user, membership, session, project, spScaleItems, allTickets] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, isGuest: true },
        }),
        prisma.projectMember.findUnique({
          where: { userId_projectId: { userId, projectId } },
        }),
        prisma.estimationSession.findFirst({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          include: { activeTicket: true },
        }),
        prisma.project.findUnique({
          where: { id: projectId },
          select: {
            ownerId: true,
            estimationMethod: true,
            workingHoursPerDay: true,
            showDistributionToAll: true,
            customShapeJson: true,
            isQuick: true,
            accessCode: true,
          },
        }),
        prisma.spScaleItem.findMany({
          where: { projectId },
          orderBy: { value: "asc" },
          select: { value: true, label: true, durationDays: true },
        }),
        prisma.ticket.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!membership)
      return NextResponse.json({ error: "Not a member" }, { status: 403 });

    // В Quick-комнате голосуют все участники без оглядки на роль;
    // в обычном проекте — только DEV/QA/BA.
    const totalVoters = project?.isQuick
      ? await prisma.projectMember.count({ where: { projectId } })
      : await prisma.projectMember.count({
          where: { projectId, role: { in: ["DEV", "QA", "BA"] } },
        });

    // В Quick-комнате роль host выполняет owner; в обычном проекте — SM-права.
    const isSM = project?.isQuick
      ? project.ownerId === userId
      : hasSmRights(userId, membership, project);
    const method: EstimationMethod = isEstimationMethod(project?.estimationMethod)
      ? project.estimationMethod
      : "COMPOSITE_SP";
    const workingHoursPerDay = project?.workingHoursPerDay ?? 8;
    const customValues = parseCustomShape(project?.customShapeJson);
    const mergedShapeValues = [
      ...customValues,
      ...(method === "FIBONACCI_SP" ? spScaleItems.map((s) => s.value) : []),
    ];

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
          where: project?.isQuick
            ? { projectId }
            : { projectId, role: { in: ["DEV", "QA", "BA"] } },
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
        if (method === "COMPOSITE_SP") {
          const compositeVotes = votes
            .filter(
              (v) =>
                v.devEffort != null &&
                v.qaEffort != null &&
                v.risk != null &&
                v.uncertainty != null,
            )
            .map((v) => ({
              devEffort: v.devEffort as number,
              qaEffort: v.qaEffort as number,
              risk: v.risk as number,
              uncertainty: v.uncertainty as number,
            }));
          const spValues = Array.from(
            new Set([
              ...spScaleItems.map((s) => s.value),
              ...customValues.filter((v) => Number.isInteger(v)),
            ]),
          );
          const calc = calculateEstimation(
            compositeVotes,
            spValues.length > 0 ? spValues : undefined,
          );
          results = { method, ...calc, voteCount: votes.length };
          individualVotes = votes.map((v) => ({
            oderId: v.user.id,
            name: v.user.name,
            devEffort: v.devEffort,
            qaEffort: v.qaEffort,
            risk: v.risk,
            uncertainty: v.uncertainty,
            singleValue: v.singleValue,
            totalScore:
              (v.devEffort ?? 0) +
              (v.qaEffort ?? 0) +
              (v.risk ?? 0) +
              (v.uncertainty ?? 0),
          }));
        } else {
          const simpleVotes = votes
            .filter((v) => v.singleValue != null)
            .map((v) => ({ value: v.singleValue as number }));
          const calc = calculateSimpleEstimation(
            simpleVotes,
            method,
            spScaleItems,
            workingHoursPerDay,
            mergedShapeValues,
          );
          results = { ...calc, voteCount: votes.length };
          individualVotes = votes.map((v) => ({
            oderId: v.user.id,
            name: v.user.name,
            devEffort: v.devEffort,
            qaEffort: v.qaEffort,
            risk: v.risk,
            uncertainty: v.uncertainty,
            singleValue: v.singleValue,
            totalScore: v.singleValue ?? 0,
          }));
        }
      }
    }

    const spScaleMap = new Map<number, string>();
    for (const s of spScaleItems) {
      spScaleMap.set(s.value, s.label);
    }
    for (const cv of customValues) {
      if (Number.isInteger(cv) && !spScaleMap.has(cv)) {
        spScaleMap.set(cv, "");
      }
    }
    const spScaleForOptions = Array.from(spScaleMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value - b.value);

    const tickets = allTickets.map((t) => ({
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
      spScale: spScaleForOptions,
      estimationConfig: {
        method,
        workingHoursPerDay,
        shape: getShapeForMethod(method, mergedShapeValues),
        customValues,
        showDistributionToAll: project?.showDistributionToAll ?? false,
      },
      quickRoom: project?.isQuick
        ? { accessCode: project.accessCode, isHost: project.ownerId === userId }
        : null,
      currentUser: {
        id: user.id,
        name: user.name,
        role: membership.role,
        isScrumMaster: isSM,
        isGuest: user.isGuest,
      },
    });
  } catch (e) {
    console.error("[GET /api/estimation/session] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
