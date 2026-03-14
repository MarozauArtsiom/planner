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

  return NextResponse.json({
    sprints: sprints.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
    })),
    members: sortedMembers,
    currentUser: { id: user.id, role: user.role },
  });
}
