import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:6969";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const inviteUrl = `${proto}://${host}/invite/${project.inviteToken}`;

  return NextResponse.json({ inviteUrl });
}
