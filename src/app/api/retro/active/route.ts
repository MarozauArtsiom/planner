import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSession();
    if (!userId) {
      return NextResponse.json({ active: false });
    }

    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ active: false });
    }

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (!membership) {
      return NextResponse.json({ active: false });
    }

    const activeBoard = await prisma.retroBoard.findFirst({
      where: {
        projectId,
        phase: { not: "COMPLETED" },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        inviteToken: true,
        phase: true,
      },
    });

    if (!activeBoard) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      boardId: activeBoard.id,
      boardTitle: activeBoard.title,
      inviteToken: activeBoard.inviteToken,
      phase: activeBoard.phase,
    });
  } catch (e) {
    console.error("[GET /api/retro/active] Error:", e);
    return NextResponse.json({ active: false });
  }
}
