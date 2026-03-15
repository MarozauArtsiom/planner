import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
  const userId = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership)
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!hasSmRights(userId, membership, project))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, isScrumMaster: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({
    ownerId: project!.ownerId,
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      role: m.role,
      isScrumMaster: m.isScrumMaster,
      userIsScrumMaster: m.user.isScrumMaster,
      isOwner: m.user.id === project!.ownerId,
    })),
  });
  } catch (e) {
    console.error("[GET /api/project/members] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
