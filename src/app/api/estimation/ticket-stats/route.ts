import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  calculateEstimation,
  calculateSimpleEstimation,
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

    const ticketId = request.nextUrl.searchParams.get("ticketId");
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!ticketId || !projectId)
      return NextResponse.json(
        { error: "ticketId and projectId required" },
        { status: 400 },
      );

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (!membership)
      return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        title: true,
        externalId: true,
        storyPoints: true,
        projectId: true,
      },
    });
    if (!ticket || ticket.projectId !== projectId)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        estimationMethod: true,
        workingHoursPerDay: true,
        showDistributionToAll: true,
        customShapeJson: true,
      },
    });
    const method: EstimationMethod = isEstimationMethod(project?.estimationMethod)
      ? project.estimationMethod
      : "COMPOSITE_SP";
    const workingHoursPerDay = project?.workingHoursPerDay ?? 8;
    const showDistributionToAll = project?.showDistributionToAll ?? false;
    const customValues = parseCustomShape(project?.customShapeJson);

    const votes = await prisma.vote.findMany({
      where: { ticketId },
      include: { user: { select: { id: true, name: true } } },
    });

    let results = null;
    if (votes.length > 0) {
      const spScaleItems = await prisma.spScaleItem.findMany({
        where: { projectId },
        select: { value: true, label: true, durationDays: true },
      });

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
      } else {
        const simpleVotes = votes
          .filter((v) => v.singleValue != null)
          .map((v) => ({ value: v.singleValue as number }));
        const calc = calculateSimpleEstimation(
          simpleVotes,
          method,
          spScaleItems,
          workingHoursPerDay,
          customValues,
        );
        results = { ...calc, voteCount: votes.length };
      }
    }

    const individualVotes = votes.map((v) => ({
      oderId: v.user.id,
      name: v.user.name,
      devEffort: v.devEffort,
      qaEffort: v.qaEffort,
      risk: v.risk,
      uncertainty: v.uncertainty,
      singleValue: v.singleValue,
      totalScore:
        method === "COMPOSITE_SP"
          ? (v.devEffort ?? 0) +
            (v.qaEffort ?? 0) +
            (v.risk ?? 0) +
            (v.uncertainty ?? 0)
          : v.singleValue ?? 0,
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
      estimationConfig: { method, workingHoursPerDay, showDistributionToAll },
    });
  } catch (e) {
    console.error("[GET /api/estimation/ticket-stats] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
