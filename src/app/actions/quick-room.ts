"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession, setSession } from "@/lib/session";
import {
  generateAccessCode,
  quickRoomExpiry,
  isQuickRoomExpired,
  normalizeGuestNickname,
} from "@/lib/quick-room";
import {
  isEstimationMethod,
  type EstimationMethod,
} from "@/lib/estimation-engine";

/** Создать Quick-комнату. Если хост не авторизован — создаём для него guest-юзера. */
export async function createQuickRoom(formData: FormData) {
  const t = await getTranslations("errors");

  // Хост — авторизованный юзер или новый гость
  let userId = await getSession();
  let user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  if (!user) {
    const rawName = (formData.get("hostNickname") as string) ?? "";
    const nickname = normalizeGuestNickname(rawName);
    if (!nickname) return { error: t("guestNicknameRequired") };

    user = await prisma.user.create({
      data: {
        name: nickname,
        passwordHash: null,
        isGuest: true,
        expiresAt: quickRoomExpiry(),
      },
    });
    await setSession(user.id);
    userId = user.id;
  }

  // Метод (опционально, дефолт FIBONACCI_SP — самый ходовой для quick poker)
  const rawMethod = (formData.get("method") as string) ?? "FIBONACCI_SP";
  const method: EstimationMethod = isEstimationMethod(rawMethod)
    ? rawMethod
    : "FIBONACCI_SP";

  // Генерируем уникальный код (retry на коллизию, шансы крошечные)
  let accessCode = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    accessCode = generateAccessCode();
    const existing = await prisma.project.findUnique({
      where: { accessCode },
    });
    if (!existing) break;
    accessCode = "";
  }
  if (!accessCode) return { error: t("quickRoomCodeFailed") };

  const tp = await getTranslations("quickRoom");
  const room = await prisma.project.create({
    data: {
      name: tp("defaultRoomName"),
      ownerId: user.id,
      isQuick: true,
      accessCode,
      expiresAt: quickRoomExpiry(),
      estimationMethod: method,
      members: {
        create: { userId: user.id, isScrumMaster: true, role: null },
      },
      // НЕ создаём SpScaleItems — Quick-комнатам не нужна шкала
    },
  });

  redirect(`/poker/${room.accessCode}`);
}

/** Найти Quick-комнату по коду с lazy-проверкой TTL. */
async function findActiveQuickRoom(accessCode: string) {
  const room = await prisma.project.findUnique({
    where: { accessCode },
    select: {
      id: true,
      ownerId: true,
      isQuick: true,
      expiresAt: true,
      estimationMethod: true,
    },
  });
  if (!room || !room.isQuick) return null;
  if (isQuickRoomExpired(room.expiresAt)) return null;
  return room;
}

/** Гостевой вход в комнату по коду + ник. */
export async function joinQuickRoomAsGuest(
  accessCode: string,
  formData: FormData,
) {
  const t = await getTranslations("errors");

  const room = await findActiveQuickRoom(accessCode);
  if (!room) return { error: t("quickRoomNotFound") };

  const rawName = (formData.get("nickname") as string) ?? "";
  const nickname = normalizeGuestNickname(rawName);
  if (!nickname) return { error: t("guestNicknameRequired") };

  // Если уже есть session — переиспользуем (может быть прошлый guest или авторизованный)
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
        expiresAt: quickRoomExpiry(),
      },
    });
    await setSession(user.id);
  } else if (user.isGuest && user.name !== nickname) {
    // Гость может обновить ник перед входом
    await prisma.user.update({
      where: { id: user.id },
      data: { name: nickname },
    });
  }

  // Добавляем как member, если ещё не там
  const existingMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: room.id } },
  });
  if (!existingMembership) {
    await prisma.projectMember.create({
      data: { userId: user.id, projectId: room.id, isScrumMaster: false, role: null },
    });
  }

  redirect(`/poker/${accessCode}`);
}

/** Запустить следующий раунд: создаём «тикет» с авто-именем «Раунд N» и делаем активным. */
export async function startNextRound(accessCode: string) {
  const t = await getTranslations("errors");

  const userId = await getSession();
  if (!userId) return { error: t("unauthorized") };

  const room = await findActiveQuickRoom(accessCode);
  if (!room) return { error: t("quickRoomNotFound") };
  if (room.ownerId !== userId) return { error: t("onlyHostCanStartRound") };

  // Считаем сколько уже было раундов
  const ticketCount = await prisma.ticket.count({ where: { projectId: room.id } });
  const roundNumber = ticketCount + 1;

  const tp = await getTranslations("quickRoom");
  const ticket = await prisma.ticket.create({
    data: {
      title: tp("roundTitle", { number: roundNumber }),
      projectId: room.id,
    },
  });

  // Активная сессия (создаём если нет) + ставим раунд активным
  let session = await prisma.estimationSession.findFirst({
    where: { projectId: room.id },
    orderBy: { createdAt: "desc" },
  });
  if (!session) {
    session = await prisma.estimationSession.create({
      data: { projectId: room.id, status: "VOTING" },
    });
  }
  await prisma.estimationSession.update({
    where: { id: session.id },
    data: { activeTicketId: ticket.id, status: "VOTING" },
  });

  return { success: true };
}

/** Хост меняет метод эстимации прямо в комнате.
 *  Если есть активный раунд — голоса в старом методе очищаются
 *  и сессия возвращается в VOTING, чтобы команда переголосовала. */
export async function changeQuickRoomMethod(
  accessCode: string,
  method: string,
) {
  const t = await getTranslations("errors");

  const userId = await getSession();
  if (!userId) return { error: t("unauthorized") };

  const room = await findActiveQuickRoom(accessCode);
  if (!room) return { error: t("quickRoomNotFound") };
  if (room.ownerId !== userId) return { error: t("onlyHostCanChangeMethod") };

  if (!isEstimationMethod(method)) {
    return { error: t("invalidEstimationMethod") };
  }

  // Метод не изменился — no-op
  if (room.estimationMethod === method) return { success: true };

  const session = await prisma.estimationSession.findFirst({
    where: { projectId: room.id },
    orderBy: { createdAt: "desc" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: room.id },
      data: { estimationMethod: method },
    });

    // Если есть активный раунд — очищаем голоса (они в старом методе)
    // и возвращаем сессию в VOTING, текущий тикет остаётся.
    if (session?.activeTicketId) {
      await tx.vote.deleteMany({
        where: { ticketId: session.activeTicketId },
      });
      await tx.estimationSession.update({
        where: { id: session.id },
        data: { status: "VOTING" },
      });
    }
  });

  return { success: true };
}
