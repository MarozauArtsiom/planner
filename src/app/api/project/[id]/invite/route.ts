import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";

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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!membership || !hasSmRights(userId, membership, project))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const links = await prisma.inviteLink.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:6969";
  const proto = hdrs.get("x-forwarded-proto") || "http";

  return NextResponse.json({
    links: links.map((l) => ({
      id: l.id,
      token: l.token,
      url: `${proto}://${host}/invite/${l.token}`,
      grantsSm: l.grantsSm,
      label: l.label,
      createdAt: l.createdAt.toISOString(),
    })),
  });
  } catch (e) {
    console.error("[GET /api/project/invite] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
