import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSession();
    if (!userId)
      return NextResponse.json({ active: false, ticketTitle: null });

    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId)
      return NextResponse.json({ active: false, ticketTitle: null });

    const session = await prisma.estimationSession.findFirst({
      where: { projectId, status: "VOTING", activeTicketId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { activeTicket: { select: { title: true } } },
    });

    return NextResponse.json({
      active: !!session,
      ticketTitle: session?.activeTicket?.title ?? null,
    });
  } catch (e) {
    console.error("[GET /api/estimation/active] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
