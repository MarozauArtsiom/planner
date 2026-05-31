import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
// Не кэшируем — крон должен видеть актуальное состояние БД
export const revalidate = 0;

/**
 * Vercel Cron endpoint для очистки истёкших Quick-комнат и гостевых юзеров.
 * Расписание: каждый час (см. `vercel.json`).
 *
 * Защита: Vercel автоматически добавляет `Authorization: Bearer <CRON_SECRET>`
 * в крон-запросы, если переменная окружения задана. На dev — пропускаем check.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.CRON_SECRET;
    const auth = request.headers.get("authorization");
    if (secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  try {
    // 1. Найти все истёкшие Quick-проекты
    const expiredProjects = await prisma.project.findMany({
      where: {
        isQuick: true,
        expiresAt: { lt: now },
      },
      select: { id: true, ownerId: true },
    });

    const projectIds = expiredProjects.map((p) => p.id);
    const ownerIds = expiredProjects.map((p) => p.ownerId);

    // 2. Удалить эстимейт-сессии, тикеты, vot'ы, members, ссылки
    //    (большинство удалится каскадно через ON DELETE CASCADE, но
    //     для project'ов schema этого не делает — чистим явно)
    await prisma.$transaction(async (tx) => {
      if (projectIds.length === 0) return;

      // Vote → Ticket → каскад идёт от Ticket
      const tickets = await tx.ticket.findMany({
        where: { projectId: { in: projectIds } },
        select: { id: true },
      });
      const ticketIds = tickets.map((t) => t.id);

      if (ticketIds.length > 0) {
        await tx.vote.deleteMany({ where: { ticketId: { in: ticketIds } } });
      }

      await tx.estimationSession.deleteMany({
        where: { projectId: { in: projectIds } },
      });

      await tx.ticket.deleteMany({
        where: { projectId: { in: projectIds } },
      });

      await tx.inviteLink.deleteMany({
        where: { projectId: { in: projectIds } },
      });

      await tx.spScaleItem.deleteMany({
        where: { projectId: { in: projectIds } },
      });

      // ProjectMember — каскадно с User у нас тоже нет, чистим явно
      await tx.projectMember.deleteMany({
        where: { projectId: { in: projectIds } },
      });

      await tx.project.deleteMany({
        where: { id: { in: projectIds } },
      });
    });

    // 3. Удалить guest-юзеров, у которых истёк expiresAt и нет других memberships
    const expiredGuests = await prisma.user.findMany({
      where: {
        isGuest: true,
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        memberships: { select: { projectId: true } },
      },
    });

    const guestsToDelete = expiredGuests
      .filter((u) => u.memberships.length === 0)
      .map((u) => u.id);

    if (guestsToDelete.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: guestsToDelete } },
      });
    }

    return NextResponse.json({
      success: true,
      deletedProjects: expiredProjects.length,
      deletedOwners: ownerIds.length,
      deletedGuests: guestsToDelete.length,
      timestamp: now.toISOString(),
    });
  } catch (e) {
    console.error("[cron cleanup-expired] Error:", e);
    return NextResponse.json(
      { error: "Cleanup failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
