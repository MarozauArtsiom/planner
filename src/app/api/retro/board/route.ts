import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  RETRO_ONLINE_THRESHOLD_MS,
  canFacilitateRetro,
  maskCardContent,
} from "@/lib/retro";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSession();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = request.nextUrl.searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const isTypingParam = request.nextUrl.searchParams.get("typing") === "1";

    const [user, board] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.retroBoard.findUnique({
        where: { inviteToken: token },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              activeSprintId: true,
              members: {
                include: { user: { select: { id: true, name: true } } },
              },
              sprints: {
                orderBy: { startDate: "desc" },
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
          columns: { orderBy: { position: "asc" } },
          groups: {
            orderBy: { position: "asc" },
            include: { votes: true },
          },
          cards: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            include: {
              author: { select: { id: true, name: true } },
              votes: true,
            },
          },
          actionItems: {
            orderBy: { createdAt: "asc" },
            include: {
              assignee: { select: { id: true, name: true } },
              ticket: {
                select: {
                  id: true,
                  title: true,
                  sprintId: true,
                  storyPoints: true,
                },
              },
            },
          },
          participants: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { joinedAt: "asc" },
          },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const membership = board.project.members.find((m) => m.userId === user.id) ?? null;
    const existingParticipant =
      board.participants.find((p) => p.userId === user.id) ?? null;

    if (!membership && !existingParticipant && board.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();

    // Обновляем присутствие текущего участника
    await prisma.retroParticipant
      .upsert({
        where: { boardId_userId: { boardId: board.id, userId: user.id } },
        create: {
          boardId: board.id,
          userId: user.id,
          lastSeenAt: now,
          isTyping: isTypingParam,
        },
        update: {
          lastSeenAt: now,
          isTyping: isTypingParam,
        },
      })
      .catch(() => undefined);

    const isFacilitator = canFacilitateRetro(
      user.id,
      board,
      membership,
      board.project,
    );

    // Загружаем перенесённые Action Items из прошлых ретро этого проекта + контекст спринта
    const [carryOverRaw, sprintWithTickets] = await Promise.all([
      prisma.retroActionItem.findMany({
        where: {
          projectId: board.projectId,
          boardId: { not: board.id },
          board: { createdAt: { lt: board.createdAt } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 25,
        include: {
          board: { select: { id: true, title: true } },
          assignee: { select: { id: true, name: true } },
          ticket: {
            select: {
              id: true,
              title: true,
              sprintId: true,
              storyPoints: true,
            },
          },
        },
      }),
      board.sprintId
        ? prisma.sprint.findUnique({
            where: { id: board.sprintId },
            include: {
              tickets: {
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  externalId: true,
                  title: true,
                  storyPoints: true,
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    // Подсчёт использованных голосов текущего пользователя
    let usedVotes = 0;
    for (const c of board.cards) {
      for (const v of c.votes) {
        if (v.userId === user.id) usedVotes += v.weight;
      }
    }
    for (const g of board.groups) {
      for (const v of g.votes) {
        if (v.userId === user.id) usedVotes += v.weight;
      }
    }

    const shouldBlurOthers =
      board.phase === "COLLECT" &&
      board.hideCardsUntilReveal &&
      !board.cardsRevealed;

    const shouldHideTotalVotes =
      board.phase === "VOTE" && board.hideVotesUntilDone;

    // Участники, которые отдали хотя бы 1 голос (для прогресса голосования)
    const voterUserIds = new Set<string>();
    for (const c of board.cards) {
      for (const v of c.votes) {
        if (v.weight > 0) voterUserIds.add(v.userId);
      }
    }
    for (const g of board.groups) {
      for (const v of g.votes) {
        if (v.weight > 0) voterUserIds.add(v.userId);
      }
    }

    const cards = board.cards.map((c) => {
      const isOwn = c.authorId === user.id;
      const isBlurred = shouldBlurOthers && !isOwn;
      const myVotes = c.votes
        .filter((v) => v.userId === user.id)
        .reduce((sum, v) => sum + v.weight, 0);
      const rawTotalVotes = c.votes.reduce((sum, v) => sum + v.weight, 0);

      return {
        id: c.id,
        content: isBlurred ? maskCardContent(c.content) : c.content,
        isBlurred,
        columnId: c.columnId,
        groupId: c.groupId,
        position: c.position,
        authorName: board.isAnonymous && !isOwn ? null : c.author.name,
        isOwn,
        myVotes,
        totalVotes: shouldHideTotalVotes ? myVotes : rawTotalVotes,
        createdAt: c.createdAt.toISOString(),
      };
    });

    const groups = board.groups.map((g) => {
      const myVotes = g.votes
        .filter((v) => v.userId === user.id)
        .reduce((sum, v) => sum + v.weight, 0);
      const rawTotalVotes = g.votes.reduce((sum, v) => sum + v.weight, 0);

      return {
        id: g.id,
        title: g.title,
        columnId: g.columnId,
        position: g.position,
        myVotes,
        totalVotes: shouldHideTotalVotes ? myVotes : rawTotalVotes,
      };
    });

    const nowMs = now.getTime();
    const participantsMap = new Map<
      string,
      {
        userId: string;
        name: string;
        isOnline: boolean;
        isTyping: boolean;
        hasVoted: boolean;
      }
    >();

    for (const p of board.participants) {
      const isSelf = p.userId === user.id;
      const lastSeenMs = isSelf ? nowMs : p.lastSeenAt.getTime();
      const isOnline = nowMs - lastSeenMs <= RETRO_ONLINE_THRESHOLD_MS;
      const isTyping =
        (isSelf ? isTypingParam : p.isTyping) && nowMs - lastSeenMs <= 8000;

      participantsMap.set(p.userId, {
        userId: p.userId,
        name: p.user.name,
        isOnline,
        isTyping,
        hasVoted: voterUserIds.has(p.userId),
      });
    }

    if (!participantsMap.has(user.id)) {
      participantsMap.set(user.id, {
        userId: user.id,
        name: user.name,
        isOnline: true,
        isTyping: isTypingParam,
        hasVoted: voterUserIds.has(user.id),
      });
    }

    // Кандидаты в ответственные по Action Items (все участники проекта + участники доски)
    const assignableUsersMap = new Map<string, { id: string; name: string }>();
    for (const m of board.project.members) {
      assignableUsersMap.set(m.user.id, { id: m.user.id, name: m.user.name });
    }
    for (const p of board.participants) {
      assignableUsersMap.set(p.user.id, { id: p.user.id, name: p.user.name });
    }

    const sprintContext = sprintWithTickets
      ? {
          id: sprintWithTickets.id,
          name: sprintWithTickets.name,
          startDate: sprintWithTickets.startDate.toISOString(),
          endDate: sprintWithTickets.endDate.toISOString(),
          ticketCount: sprintWithTickets.tickets.length,
          totalSp: sprintWithTickets.tickets.reduce(
            (sum, t) => sum + (t.storyPoints ?? 0),
            0,
          ),
          tickets: sprintWithTickets.tickets,
        }
      : null;

    return NextResponse.json({
      board: {
        id: board.id,
        title: board.title,
        inviteToken: board.inviteToken,
        template: board.template,
        phase: board.phase,
        isAnonymous: board.isAnonymous,
        hideCardsUntilReveal: board.hideCardsUntilReveal,
        cardsRevealed: board.cardsRevealed,
        maxVotesPerUser: board.maxVotesPerUser,
        hideVotesUntilDone: board.hideVotesUntilDone,
        timerEndsAt: board.timerEndsAt ? board.timerEndsAt.toISOString() : null,
        timerDurationSec: board.timerDurationSec,
        focusedItemId: board.focusedItemId,
        createdAt: board.createdAt.toISOString(),
        completedAt: board.completedAt ? board.completedAt.toISOString() : null,
        projectId: board.projectId,
        projectName: board.project.name,
        sprintId: board.sprintId,
      },
      currentUser: {
        id: user.id,
        name: user.name,
        isGuest: user.isGuest,
        isFacilitator,
        usedVotes,
        remainingVotes: Math.max(0, board.maxVotesPerUser - usedVotes),
      },
      columns: board.columns.map((col) => ({
        id: col.id,
        title: col.title,
        color: col.color,
        position: col.position,
      })),
      groups,
      cards,
      actionItems: board.actionItems.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        assigneeId: a.assigneeId,
        assigneeName: a.assignee?.name ?? null,
        ticketId: a.ticketId,
        ticketTitle: a.ticket?.title ?? null,
        ticketSp: a.ticket?.storyPoints ?? null,
      })),
      carryOverItems: carryOverRaw.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        assigneeName: a.assignee?.name ?? null,
        fromBoardTitle: a.board.title,
        ticketId: a.ticketId,
      })),
      participants: Array.from(participantsMap.values()),
      assignableUsers: Array.from(assignableUsersMap.values()),
      sprints: board.project.sprints.map((s) => ({
        id: s.id,
        name: s.name,
        isActive: s.id === board.project.activeSprintId,
      })),
      sprintContext,
    });
  } catch (e) {
    console.error("[GET /api/retro/board] Error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
