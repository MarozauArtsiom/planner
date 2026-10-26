"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession, setSession, clearSession } from "@/lib/session";
import { DEFAULT_SP_SCALE } from "@/lib/sp-scale";
import { normalizeGuestNickname } from "@/lib/quick-room";
import {
  TEMPLATE_COLUMNS,
  canFacilitateRetro,
  isRetroColor,
  isRetroPhase,
  isRetroTemplate,
  retroGuestExpiry,
  type RetroColumnColor,
  type RetroPhase,
  type RetroTemplate,
} from "@/lib/retro";

async function requireUser() {
  const userId = await getSession();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  return user;
}

async function requireFullUser() {
  const user = await requireUser();
  if (user.isGuest) {
    redirect("/login?guestUpgrade=1");
  }
  return user;
}

async function requireBoardAccess(boardId: string) {
  const t = await getTranslations("errors");
  const user = await requireUser();
  const board = await prisma.retroBoard.findUnique({
    where: { id: boardId },
    include: {
      project: { select: { id: true, ownerId: true, name: true } },
    },
  });
  if (!board) throw new Error(t("retroNotFound"));

  const [membership, participant] = await Promise.all([
    prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: user.id, projectId: board.projectId },
      },
    }),
    prisma.retroParticipant.findUnique({
      where: { boardId_userId: { boardId: board.id, userId: user.id } },
    }),
  ]);

  if (!membership && !participant && board.createdById !== user.id) {
    throw new Error(t("noProjectAccess"));
  }

  const isFacilitator = canFacilitateRetro(
    user.id,
    board,
    membership,
    board.project,
  );

  return { user, board, membership, participant, isFacilitator };
}

async function requireBoardFacilitator(boardId: string) {
  const t = await getTranslations("errors");
  const ctx = await requireBoardAccess(boardId);
  if (!ctx.isFacilitator) {
    throw new Error(t("onlyFacilitatorAction"));
  }
  return ctx;
}

/**
 * Создание новой ретро-доски (из /project/[id]/retro или из хаба /retro).
 * Если у пользователя ещё нет проекта (или выбрано создание новой команды),
 * автоматически создаёт Project.
 */
export async function createRetroBoard(formData: FormData) {
  const t = await getTranslations("errors");
  const tr = await getTranslations("retro");
  const user = await requireFullUser();

  const rawTitle = (formData.get("title") as string)?.trim();
  const title = rawTitle || tr("defaultBoardTitle");
  if (title.length > 120) return { error: t("maxChars") };

  const rawTemplate = (formData.get("template") as string) ?? "WENT_WELL_TO_IMPROVE";
  const template: RetroTemplate = isRetroTemplate(rawTemplate)
    ? rawTemplate
    : "WENT_WELL_TO_IMPROVE";

  const isAnonymous = formData.get("isAnonymous") === "true" || formData.get("isAnonymous") === "on";
  const hideCardsUntilReveal =
    formData.get("hideCardsUntilReveal") !== "false";
  const rawMaxVotes = parseInt((formData.get("maxVotesPerUser") as string) ?? "5", 10);
  const maxVotesPerUser = Number.isFinite(rawMaxVotes)
    ? Math.min(20, Math.max(1, rawMaxVotes))
    : 5;

  let projectId = (formData.get("projectId") as string)?.trim() || "";
  const newProjectName = (formData.get("newProjectName") as string)?.trim();

  if (!projectId || projectId === "__NEW__") {
    const teamName = newProjectName || `${user.name} Team`;
    const createdProject = await prisma.project.create({
      data: {
        name: teamName,
        ownerId: user.id,
        members: {
          create: { userId: user.id, isScrumMaster: true, role: user.role },
        },
        spScaleItems: {
          create: DEFAULT_SP_SCALE.map((item) => ({
            value: item.value,
            label: item.label,
            durationDays: item.durationDays,
          })),
        },
      },
    });
    projectId = createdProject.id;
  } else {
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });
    if (!membership) return { error: t("noProjectAccess") };
  }

  const rawSprintId = (formData.get("sprintId") as string)?.trim() || null;
  let sprintId: string | null = null;
  if (rawSprintId && rawSprintId !== "__NONE__") {
    const sprint = await prisma.sprint.findFirst({
      where: { id: rawSprintId, projectId },
      select: { id: true },
    });
    if (sprint) sprintId = sprint.id;
  }

  const colDefs = TEMPLATE_COLUMNS[template];

  const board = await prisma.retroBoard.create({
    data: {
      title,
      template,
      phase: "COLLECT",
      isAnonymous,
      hideCardsUntilReveal,
      cardsRevealed: !hideCardsUntilReveal,
      maxVotesPerUser,
      hideVotesUntilDone: true,
      projectId,
      sprintId,
      createdById: user.id,
      columns: {
        create: colDefs.map((col, idx) => ({
          title: tr(col.titleKey as "colWentWell") || col.fallbackTitle,
          color: col.color,
          position: idx,
        })),
      },
      participants: {
        create: {
          userId: user.id,
        },
      },
    },
  });

  redirect(`/retro/${board.inviteToken}`);
}

/**
 * Гостевой вход по ссылке доски (/retro/[token]) без регистрации, только по имени.
 */
export async function joinRetroAsGuest(
  inviteToken: string,
  formData: FormData,
) {
  const t = await getTranslations("errors");

  const board = await prisma.retroBoard.findUnique({
    where: { inviteToken },
    select: { id: true, inviteToken: true },
  });
  if (!board) return { error: t("retroNotFound") };

  const rawName = (formData.get("nickname") as string) ?? "";
  const nickname = normalizeGuestNickname(rawName);
  if (!nickname) return { error: t("guestNicknameRequired") };

  const existingUserId = await getSession();
  let user = existingUserId
    ? await prisma.user.findUnique({ where: { id: existingUserId } })
    : null;

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: nickname,
        passwordHash: null,
        isGuest: true,
        expiresAt: retroGuestExpiry(),
      },
    });
    await setSession(user.id, "guest");
  } else if (user.isGuest && user.name !== nickname) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: nickname, expiresAt: retroGuestExpiry() },
    });
  }

  await prisma.retroParticipant.upsert({
    where: { boardId_userId: { boardId: board.id, userId: user.id } },
    create: { boardId: board.id, userId: user.id },
    update: { lastSeenAt: new Date() },
  });

  redirect(`/retro/${board.inviteToken}`);
}

/**
 * Выход гостя с ретро-доски.
 */
export async function leaveRetroBoard(inviteToken: string) {
  const userId = await getSession();
  if (!userId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isGuest: true },
  });

  if (user?.isGuest) {
    await clearSession();
    redirect("/");
  }

  const board = await prisma.retroBoard.findUnique({
    where: { inviteToken },
    select: { projectId: true },
  });

  if (board) {
    redirect(`/project/${board.projectId}/retro`);
  }
  redirect("/retro");
}

/**
 * Переключение фазы ретро фасилитатором.
 */
export async function setRetroPhase(boardId: string, phase: string) {
  const t = await getTranslations("errors");
  try {
    if (!isRetroPhase(phase)) return { error: t("unknownError") };
    const { board } = await requireBoardFacilitator(boardId);

    const nextPhase: RetroPhase = phase;
    const data: {
      phase: string;
      cardsRevealed?: boolean;
      completedAt?: Date | null;
      focusedItemId?: string | null;
      timerEndsAt?: Date | null;
      timerDurationSec?: number | null;
    } = { phase: nextPhase };

    // При переходе из COLLECT дальше автоматически раскрываем карточки
    if (nextPhase !== "COLLECT") {
      data.cardsRevealed = true;
    }
    if (nextPhase === "COMPLETED") {
      data.completedAt = board.completedAt ?? new Date();
      data.timerEndsAt = null;
      data.timerDurationSec = null;
    } else {
      data.completedAt = null;
    }
    if (nextPhase !== "DISCUSS") {
      data.focusedItemId = null;
    }

    await prisma.retroBoard.update({
      where: { id: boardId },
      data,
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Раскрыть или скрыть карточки на фазе COLLECT.
 */
export async function toggleRevealRetroCards(
  boardId: string,
  revealed: boolean,
) {
  const t = await getTranslations("errors");
  try {
    await requireBoardFacilitator(boardId);
    await prisma.retroBoard.update({
      where: { id: boardId },
      data: { cardsRevealed: revealed },
    });
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Обновление настроек доски фасилитатором.
 */
export async function updateRetroSettings(
  boardId: string,
  formData: FormData,
) {
  const t = await getTranslations("errors");
  try {
    const { board } = await requireBoardFacilitator(boardId);

    const rawTitle = (formData.get("title") as string)?.trim();
    const title = rawTitle || board.title;
    const isAnonymous = formData.get("isAnonymous") === "true";
    const hideCardsUntilReveal =
      formData.get("hideCardsUntilReveal") === "true";
    const hideVotesUntilDone = formData.get("hideVotesUntilDone") === "true";
    const rawMaxVotes = parseInt(
      (formData.get("maxVotesPerUser") as string) ?? "5",
      10,
    );
    const maxVotesPerUser = Number.isFinite(rawMaxVotes)
      ? Math.min(20, Math.max(1, rawMaxVotes))
      : board.maxVotesPerUser;

    const rawSprintId = (formData.get("sprintId") as string)?.trim();
    let sprintId: string | null = board.sprintId;
    if (rawSprintId === "__NONE__") {
      sprintId = null;
    } else if (rawSprintId) {
      const sprint = await prisma.sprint.findFirst({
        where: { id: rawSprintId, projectId: board.projectId },
        select: { id: true },
      });
      if (sprint) sprintId = sprint.id;
    }

    await prisma.retroBoard.update({
      where: { id: boardId },
      data: {
        title,
        isAnonymous,
        hideCardsUntilReveal,
        hideVotesUntilDone,
        maxVotesPerUser,
        sprintId,
      },
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Управление синхронным таймером фазы.
 */
export async function controlRetroTimer(
  boardId: string,
  action: "start" | "stop",
  durationSec?: number,
) {
  const t = await getTranslations("errors");
  try {
    await requireBoardFacilitator(boardId);

    if (action === "stop") {
      await prisma.retroBoard.update({
        where: { id: boardId },
        data: { timerEndsAt: null, timerDurationSec: null },
      });
      return { success: true };
    }

    const sec =
      durationSec && Number.isFinite(durationSec)
        ? Math.min(3600, Math.max(15, Math.round(durationSec)))
        : 300;
    const endsAt = new Date(Date.now() + sec * 1000);

    await prisma.retroBoard.update({
      where: { id: boardId },
      data: {
        timerEndsAt: endsAt,
        timerDurationSec: sec,
      },
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Установка фокуса на обсуждаемой карточке или группе (фаза DISCUSS).
 */
export async function setRetroFocus(
  boardId: string,
  focusedItemId: string | null,
) {
  const t = await getTranslations("errors");
  try {
    await requireBoardFacilitator(boardId);
    await prisma.retroBoard.update({
      where: { id: boardId },
      data: { focusedItemId },
    });
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Удаление ретро-доски фасилитатором.
 */
export async function deleteRetroBoard(boardId: string) {
  const t = await getTranslations("errors");
  try {
    await requireBoardFacilitator(boardId);
    await prisma.retroBoard.delete({ where: { id: boardId } });
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Добавление новой колонки.
 */
export async function addRetroColumn(boardId: string, formData: FormData) {
  const t = await getTranslations("errors");
  try {
    await requireBoardFacilitator(boardId);
    const title = (formData.get("title") as string)?.trim();
    if (!title) return { error: t("nameRequired") };
    const rawColor = (formData.get("color") as string) ?? "blue";
    const color: RetroColumnColor = isRetroColor(rawColor) ? rawColor : "blue";

    const count = await prisma.retroColumn.count({ where: { boardId } });

    await prisma.retroColumn.create({
      data: {
        boardId,
        title: title.slice(0, 80),
        color,
        position: count,
      },
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Переименование и смена цвета колонки.
 */
export async function updateRetroColumn(columnId: string, formData: FormData) {
  const t = await getTranslations("errors");
  try {
    const col = await prisma.retroColumn.findUnique({
      where: { id: columnId },
      select: { id: true, boardId: true, title: true, color: true },
    });
    if (!col) return { error: t("unknownError") };
    await requireBoardFacilitator(col.boardId);

    const rawTitle = (formData.get("title") as string)?.trim();
    const title = rawTitle ? rawTitle.slice(0, 80) : col.title;
    const rawColor = formData.get("color") as string;
    const color: RetroColumnColor = isRetroColor(rawColor)
      ? rawColor
      : (col.color as RetroColumnColor);

    await prisma.retroColumn.update({
      where: { id: columnId },
      data: { title, color },
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Удаление колонки (если остаётся хотя бы 1 колонка).
 */
export async function deleteRetroColumn(columnId: string) {
  const t = await getTranslations("errors");
  try {
    const col = await prisma.retroColumn.findUnique({
      where: { id: columnId },
      select: { id: true, boardId: true },
    });
    if (!col) return { error: t("unknownError") };
    await requireBoardFacilitator(col.boardId);

    const totalCols = await prisma.retroColumn.count({
      where: { boardId: col.boardId },
    });
    if (totalCols <= 1) return { error: t("cannotDeleteLastColumn") };

    await prisma.retroColumn.delete({ where: { id: columnId } });
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Добавление карточки в колонку.
 */
export async function addRetroCard(
  boardId: string,
  columnId: string,
  content: string,
) {
  const t = await getTranslations("errors");
  try {
    const { user, board, isFacilitator } = await requireBoardAccess(boardId);
    if (board.phase === "COMPLETED") return { error: t("retroAlreadyCompleted") };
    if (board.phase !== "COLLECT" && !isFacilitator) {
      return { error: t("cardAddingLockedInPhase") };
    }

    const trimmed = content?.trim();
    if (!trimmed) return { error: t("descriptionRequired") };

    const col = await prisma.retroColumn.findFirst({
      where: { id: columnId, boardId },
      select: { id: true },
    });
    if (!col) return { error: t("unknownError") };

    const count = await prisma.retroCard.count({ where: { columnId } });

    await prisma.retroCard.create({
      data: {
        boardId,
        columnId,
        authorId: user.id,
        content: trimmed.slice(0, 1000),
        position: count,
      },
    });

    // Сбрасываем индикатор печати после отправки карточки
    await prisma.retroParticipant
      .updateMany({
        where: { boardId, userId: user.id },
        data: { isTyping: false, lastSeenAt: new Date() },
      })
      .catch(() => undefined);

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Редактирование своей карточки (или любой карточки фасилитатором).
 */
export async function updateRetroCard(cardId: string, content: string) {
  const t = await getTranslations("errors");
  try {
    const card = await prisma.retroCard.findUnique({
      where: { id: cardId },
      select: { id: true, boardId: true, authorId: true },
    });
    if (!card) return { error: t("unknownError") };

    const { user, board, isFacilitator } = await requireBoardAccess(
      card.boardId,
    );
    if (board.phase === "COMPLETED") return { error: t("retroAlreadyCompleted") };
    if (card.authorId !== user.id && !isFacilitator) {
      return { error: t("onlyAuthorOrFacilitator") };
    }

    const trimmed = content?.trim();
    if (!trimmed) return { error: t("descriptionRequired") };

    await prisma.retroCard.update({
      where: { id: cardId },
      data: { content: trimmed.slice(0, 1000) },
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Удаление своей карточки (или любой карточки фасилитатором).
 */
export async function deleteRetroCard(cardId: string) {
  const t = await getTranslations("errors");
  try {
    const card = await prisma.retroCard.findUnique({
      where: { id: cardId },
      select: { id: true, boardId: true, authorId: true },
    });
    if (!card) return { error: t("unknownError") };

    const { user, board, isFacilitator } = await requireBoardAccess(
      card.boardId,
    );
    if (board.phase === "COMPLETED") return { error: t("retroAlreadyCompleted") };
    if (card.authorId !== user.id && !isFacilitator) {
      return { error: t("onlyAuthorOrFacilitator") };
    }

    await prisma.retroCard.delete({ where: { id: cardId } });
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Перемещение карточки в другую колонку или группу (фаза GROUP или фасилитатор).
 */
export async function moveRetroCard(
  cardId: string,
  targetColumnId: string,
  targetGroupId: string | null = null,
) {
  const t = await getTranslations("errors");
  try {
    const card = await prisma.retroCard.findUnique({
      where: { id: cardId },
      select: { id: true, boardId: true, columnId: true, groupId: true },
    });
    if (!card) return { error: t("unknownError") };

    const { board, isFacilitator } = await requireBoardAccess(card.boardId);
    if (board.phase === "COMPLETED") return { error: t("retroAlreadyCompleted") };
    if (board.phase !== "GROUP" && board.phase !== "COLLECT" && !isFacilitator) {
      return { error: t("groupingLockedInPhase") };
    }

    const col = await prisma.retroColumn.findFirst({
      where: { id: targetColumnId, boardId: card.boardId },
      select: { id: true },
    });
    if (!col) return { error: t("unknownError") };

    let validGroupId: string | null = null;
    if (targetGroupId) {
      const grp = await prisma.retroCardGroup.findFirst({
        where: { id: targetGroupId, boardId: card.boardId },
        select: { id: true, columnId: true },
      });
      if (grp) {
        validGroupId = grp.id;
      }
    }

    await prisma.retroCard.update({
      where: { id: cardId },
      data: {
        columnId: targetColumnId,
        groupId: validGroupId,
      },
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Объединение двух карточек в группу с общим заголовком (или добавление в группу целевой карточки).
 */
export async function mergeRetroCards(
  sourceCardId: string,
  targetCardId: string,
  customGroupTitle?: string,
) {
  const t = await getTranslations("errors");
  const tr = await getTranslations("retro");
  try {
    if (sourceCardId === targetCardId) return { success: true };

    const [sourceCard, targetCard] = await Promise.all([
      prisma.retroCard.findUnique({ where: { id: sourceCardId } }),
      prisma.retroCard.findUnique({ where: { id: targetCardId } }),
    ]);

    if (!sourceCard || !targetCard || sourceCard.boardId !== targetCard.boardId) {
      return { error: t("unknownError") };
    }

    const { board, isFacilitator } = await requireBoardAccess(
      sourceCard.boardId,
    );
    if (board.phase === "COMPLETED") return { error: t("retroAlreadyCompleted") };
    if (board.phase !== "GROUP" && !isFacilitator) {
      return { error: t("groupingLockedInPhase") };
    }

    // Если целевая карточка уже в группе — просто добавляем исходную карточку в эту группу
    if (targetCard.groupId) {
      await prisma.retroCard.update({
        where: { id: sourceCard.id },
        data: {
          columnId: targetCard.columnId,
          groupId: targetCard.groupId,
        },
      });
      return { success: true };
    }

    // Иначе создаём новую группу в колонке целевой карточки
    const groupCount = await prisma.retroCardGroup.count({
      where: { columnId: targetCard.columnId },
    });

    const title =
      customGroupTitle?.trim() ||
      targetCard.content.slice(0, 48) ||
      tr("defaultGroupTitle", { number: groupCount + 1 });

    await prisma.$transaction(async (tx) => {
      const group = await tx.retroCardGroup.create({
        data: {
          boardId: targetCard.boardId,
          columnId: targetCard.columnId,
          title,
          position: groupCount,
        },
      });

      await tx.retroCard.updateMany({
        where: { id: { in: [sourceCard.id, targetCard.id] } },
        data: {
          columnId: targetCard.columnId,
          groupId: group.id,
        },
      });
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Переименование группы карточек.
 */
export async function updateRetroGroup(groupId: string, title: string) {
  const t = await getTranslations("errors");
  try {
    const grp = await prisma.retroCardGroup.findUnique({
      where: { id: groupId },
      select: { id: true, boardId: true },
    });
    if (!grp) return { error: t("unknownError") };

    const { board } = await requireBoardAccess(grp.boardId);
    if (board.phase === "COMPLETED") return { error: t("retroAlreadyCompleted") };

    const trimmed = title?.trim();
    if (!trimmed) return { error: t("nameRequired") };

    await prisma.retroCardGroup.update({
      where: { id: groupId },
      data: { title: trimmed.slice(0, 100) },
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Разгруппировать карточки обратно в колонку.
 */
export async function ungroupRetroCards(groupId: string) {
  const t = await getTranslations("errors");
  try {
    const grp = await prisma.retroCardGroup.findUnique({
      where: { id: groupId },
      select: { id: true, boardId: true },
    });
    if (!grp) return { error: t("unknownError") };

    const { board, isFacilitator } = await requireBoardAccess(grp.boardId);
    if (board.phase === "COMPLETED") return { error: t("retroAlreadyCompleted") };
    if (board.phase !== "GROUP" && !isFacilitator) {
      return { error: t("groupingLockedInPhase") };
    }

    await prisma.$transaction(async (tx) => {
      await tx.retroCard.updateMany({
        where: { groupId },
        data: { groupId: null },
      });
      await tx.retroCardGroup.delete({ where: { id: groupId } });
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Dot Voting: добавить (+1) или убрать (-1) точку за карточку или группу.
 * Контролирует лимит maxVotesPerUser по всей доске.
 */
export async function adjustRetroVote(
  boardId: string,
  targetType: "card" | "group",
  targetId: string,
  delta: 1 | -1,
) {
  const t = await getTranslations("errors");
  try {
    const { user, board } = await requireBoardAccess(boardId);
    if (board.phase !== "VOTE") {
      return { error: t("votingNotActive") };
    }

    // Считаем сколько точек пользователь уже поставил на этой доске
    const userVotes = await prisma.retroVote.findMany({
      where: {
        userId: user.id,
        OR: [{ card: { boardId } }, { group: { boardId } }],
      },
      select: { id: true, weight: true, cardId: true, groupId: true },
    });

    const totalUsed = userVotes.reduce((sum, v) => sum + v.weight, 0);

    if (delta === 1 && totalUsed >= board.maxVotesPerUser) {
      return { error: t("voteLimitReached") };
    }

    const existing = userVotes.find((v) =>
      targetType === "card" ? v.cardId === targetId : v.groupId === targetId,
    );

    if (delta === 1) {
      if (existing) {
        await prisma.retroVote.update({
          where: { id: existing.id },
          data: { weight: existing.weight + 1 },
        });
      } else {
        await prisma.retroVote.create({
          data: {
            userId: user.id,
            weight: 1,
            cardId: targetType === "card" ? targetId : null,
            groupId: targetType === "group" ? targetId : null,
          },
        });
      }
    } else {
      if (!existing) return { success: true };
      if (existing.weight <= 1) {
        await prisma.retroVote.delete({ where: { id: existing.id } });
      } else {
        await prisma.retroVote.update({
          where: { id: existing.id },
          data: { weight: existing.weight - 1 },
        });
      }
    }

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Создание Action Item (с ответственным и сроком).
 */
export async function addRetroActionItem(
  boardId: string,
  formData: FormData,
) {
  const t = await getTranslations("errors");
  try {
    const { board } = await requireBoardAccess(boardId);
    if (board.phase === "COMPLETED") return { error: t("retroAlreadyCompleted") };

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { error: t("nameRequired") };

    const rawAssigneeId = (formData.get("assigneeId") as string)?.trim() || null;
    const rawDueDate = (formData.get("dueDate") as string)?.trim() || null;
    let dueDate: Date | null = null;
    if (rawDueDate) {
      const parsed = new Date(rawDueDate);
      if (!isNaN(parsed.getTime())) dueDate = parsed;
    }

    await prisma.retroActionItem.create({
      data: {
        boardId: board.id,
        projectId: board.projectId,
        title: title.slice(0, 300),
        assigneeId:
          rawAssigneeId && rawAssigneeId !== "__NONE__" ? rawAssigneeId : null,
        dueDate,
        status: "OPEN",
      },
    });

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Переключение статуса Action Item (OPEN <-> DONE).
 * Работает как для текущих Action Items, так и для перенесённых (carry-over) из прошлых ретро команды!
 */
export async function toggleRetroActionItem(actionItemId: string) {
  const t = await getTranslations("errors");
  try {
    const user = await requireUser();
    const item = await prisma.retroActionItem.findUnique({
      where: { id: actionItemId },
      select: { id: true, status: true, projectId: true, boardId: true },
    });
    if (!item) return { error: t("unknownError") };

    // Проверяем доступ к проекту или доске
    const [membership, participant] = await Promise.all([
      prisma.projectMember.findUnique({
        where: {
          userId_projectId: { userId: user.id, projectId: item.projectId },
        },
      }),
      prisma.retroParticipant.findFirst({
        where: { userId: user.id, board: { projectId: item.projectId } },
      }),
    ]);

    if (!membership && !participant) {
      return { error: t("noProjectAccess") };
    }

    const nextStatus = item.status === "DONE" ? "OPEN" : "DONE";
    await prisma.retroActionItem.update({
      where: { id: actionItemId },
      data: { status: nextStatus },
    });

    return { success: true, status: nextStatus };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Удаление Action Item.
 */
export async function deleteRetroActionItem(actionItemId: string) {
  const t = await getTranslations("errors");
  try {
    const item = await prisma.retroActionItem.findUnique({
      where: { id: actionItemId },
      select: { id: true, boardId: true },
    });
    if (!item) return { error: t("unknownError") };

    await requireBoardAccess(item.boardId);
    await prisma.retroActionItem.delete({ where: { id: actionItemId } });
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}

/**
 * Экосистемный мост: конвертация RetroActionItem в Ticket планера (в бэклог или спринт).
 */
export async function convertActionItemToTicket(
  actionItemId: string,
  targetSprintId?: string | null,
) {
  const t = await getTranslations("errors");
  try {
    const user = await requireFullUser();
    const item = await prisma.retroActionItem.findUnique({
      where: { id: actionItemId },
      include: {
        board: { select: { title: true, sprintId: true } },
        project: { select: { id: true, activeSprintId: true } },
      },
    });
    if (!item) return { error: t("unknownError") };
    if (item.ticketId) return { success: true, ticketId: item.ticketId };

    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: user.id, projectId: item.projectId },
      },
    });
    if (!membership) return { error: t("noProjectAccess") };

    let sprintId: string | null = null;
    if (targetSprintId && targetSprintId !== "__BACKLOG__") {
      const sprint = await prisma.sprint.findFirst({
        where: { id: targetSprintId, projectId: item.projectId },
        select: { id: true },
      });
      if (sprint) sprintId = sprint.id;
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          title: item.title,
          description: `[Retro: ${item.board.title}]`,
          projectId: item.projectId,
          sprintId,
        },
      });

      await tx.retroActionItem.update({
        where: { id: item.id },
        data: { ticketId: created.id },
      });

      return created;
    });

    return { success: true, ticketId: ticket.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : t("unknownError") };
  }
}
