import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { parseCustomShape } from "@/lib/estimation-engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
  const userId = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      sprintDurationWeeks: true,
      sprintNameTemplate: true,
      taskCoefficient: true,
      estimationMethod: true,
      workingHoursPerDay: true,
      customShapeJson: true,
      activeSprintId: true,
      spScaleItems: {
        orderBy: { value: "asc" },
        select: { value: true, label: true, durationDays: true },
      },
      sprints: {
        orderBy: { startDate: "asc" },
        select: { id: true, name: true, startDate: true, endDate: true },
      },
    },
  });

  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  return NextResponse.json({
    sprintDurationWeeks: project.sprintDurationWeeks,
    sprintNameTemplate: project.sprintNameTemplate,
    taskCoefficient: project.taskCoefficient,
    estimationMethod: project.estimationMethod,
    workingHoursPerDay: project.workingHoursPerDay,
    customValues: parseCustomShape(project.customShapeJson),
    activeSprintId: project.activeSprintId,
    spScale: project.spScaleItems,
    sprints: project.sprints.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
    })),
  });
  } catch (e) {
    console.error("[GET /api/project/settings] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
