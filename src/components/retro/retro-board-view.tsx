"use client";

import {
  useState,
  useEffect,
  useRef,
  useTransition,
  useCallback,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  useRetroPolling,
  type RetroCardItem,
  type RetroColumnItem,
  type RetroGroupItem,
} from "@/hooks/use-retro-polling";
import {
  setRetroPhase,
  toggleRevealRetroCards,
  updateRetroSettings,
  controlRetroTimer,
  setRetroFocus,
  addRetroColumn,
  updateRetroColumn,
  deleteRetroColumn,
  addRetroCard,
  updateRetroCard,
  deleteRetroCard,
  moveRetroCard,
  mergeRetroCards,
  updateRetroGroup,
  ungroupRetroCards,
  adjustRetroVote,
  addRetroActionItem,
  toggleRetroActionItem,
  deleteRetroActionItem,
  convertActionItemToTicket,
  leaveRetroBoard,
} from "@/app/actions/retro";
import {
  RETRO_COLORS,
  RETRO_PHASES,
  type RetroColumnColor,
  type RetroPhase,
} from "@/lib/retro";
import { formatRetroMarkdown, downloadRetroCsv } from "@/lib/retro-export";
import { RetroQrModal } from "./retro-qr-modal";
import {
  PageShell,
  LoadingScreen,
  Badge,
  Button,
  Card,
  Input,
} from "@/components/ui";

const COLUMN_ACCENTS: Record<
  RetroColumnColor,
  {
    headerBg: string;
    dot: string;
    border: string;
    badge: string;
  }
> = {
  emerald: {
    headerBg: "bg-emerald-50/80 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800/70",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  amber: {
    headerBg: "bg-amber-50/80 dark:bg-amber-950/30",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800/70",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  },
  rose: {
    headerBg: "bg-rose-50/80 dark:bg-rose-950/30",
    dot: "bg-rose-500",
    border: "border-rose-200 dark:border-rose-800/70",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
  },
  blue: {
    headerBg: "bg-blue-50/80 dark:bg-blue-950/30",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-800/70",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  },
  violet: {
    headerBg: "bg-violet-50/80 dark:bg-violet-950/30",
    dot: "bg-violet-500",
    border: "border-violet-200 dark:border-violet-800/70",
    badge:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300",
  },
  zinc: {
    headerBg: "bg-zinc-100/80 dark:bg-zinc-800/40",
    dot: "bg-zinc-500",
    border: "border-zinc-200 dark:border-zinc-700",
    badge: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

/**
 * Проигрывает мягкий звуковой сигнал через Web Audio API при завершении таймера фазы.
 */
function playTimerFinishChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(
        0.18,
        ctx.currentTime + i * 0.14 + 0.04,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + i * 0.14 + 0.55,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.14);
      osc.stop(ctx.currentTime + i * 0.14 + 0.6);
    });
  } catch {
    // AudioContext blocked or unsupported
  }
}

export function RetroBoardView({ inviteToken }: { inviteToken: string }) {
  const t = useTranslations("retro");
  const tc = useTranslations("common");
  const { state, refresh, markTyping } = useRetroPolling(inviteToken, 3000);
  const [isPending, startTransition] = useTransition();

  const [qrOpen, setQrOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sprintDrawerOpen, setSprintDrawerOpen] = useState(false);
  const [carryOverExpanded, setCarryOverExpanded] = useState(true);
  const [addingColOpen, setAddingColOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColColor, setNewColColor] = useState<RetroColumnColor>("blue");
  const [mdCopied, setMdCopied] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Action item creation state
  const [actionTitle, setActionTitle] = useState("");
  const [actionAssigneeId, setActionAssigneeId] = useState("__NONE__");
  const [actionDueDate, setActionDueDate] = useState("");
  const [ticketTargetSprint, setTicketTargetSprint] = useState("__BACKLOG__");

  // Таймер обратного отсчёта
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const chimePlayedForRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const act = useCallback(
    (fn: () => Promise<{ error?: string } | unknown>) => {
      startTransition(async () => {
        const res = await fn();
        if (
          res &&
          typeof res === "object" &&
          "error" in res &&
          typeof res.error === "string"
        ) {
          setActionToast(res.error);
          setTimeout(() => setActionToast(null), 3500);
        }
        refresh();
      });
    },
    [refresh],
  );

  const timerEndsAt = state?.board.timerEndsAt ?? null;

  useEffect(() => {
    if (!timerEndsAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemainingSec(null);
      return;
    }

    const updateTick = () => {
      const diffMs = new Date(timerEndsAt).getTime() - Date.now();
      const sec = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSec(sec);
      if (sec === 0 && chimePlayedForRef.current !== timerEndsAt) {
        chimePlayedForRef.current = timerEndsAt;
        playTimerFinishChime();
      }
    };

    updateTick();
    const id = setInterval(updateTick, 1000);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  if (!state) {
    return <LoadingScreen label={tc("loading")} />;
  }

  const {
    board,
    currentUser,
    columns,
    groups,
    cards,
    actionItems,
    carryOverItems,
    participants,
    assignableUsers,
    sprints,
    sprintContext,
  } = state;

  const isFacilitator = currentUser.isFacilitator;
  const isCompleted = board.phase === "COMPLETED";
  const onlineParticipants = participants.filter((p) => p.isOnline);
  const typingParticipants = participants.filter(
    (p) => p.isTyping && p.userId !== currentUser.id,
  );

  const shouldSortByVotes =
    board.phase === "DISCUSS" ||
    board.phase === "ACTIONS" ||
    board.phase === "COMPLETED";

  const focusedCard = board.focusedItemId
    ? cards.find((c) => c.id === board.focusedItemId) ?? null
    : null;
  const focusedGroup = board.focusedItemId
    ? groups.find((g) => g.id === board.focusedItemId) ?? null
    : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("card:")) return;
    const cardId = activeId.replace("card:", "");

    if (overId.startsWith("col:")) {
      const targetColumnId = overId.replace("col:", "");
      act(() => moveRetroCard(cardId, targetColumnId, null));
    } else if (overId.startsWith("group:")) {
      const targetGroupId = overId.replace("group:", "");
      const grp = groups.find((g) => g.id === targetGroupId);
      if (grp) {
        act(() => moveRetroCard(cardId, grp.columnId, grp.id));
      }
    } else if (overId.startsWith("card:")) {
      const targetCardId = overId.replace("card:", "");
      if (cardId !== targetCardId) {
        act(() => mergeRetroCards(cardId, targetCardId));
      }
    }
  };

  const handleCopyMarkdown = async () => {
    const md = formatRetroMarkdown(state);
    await navigator.clipboard.writeText(md);
    setMdCopied(true);
    setTimeout(() => setMdCopied(false), 2200);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    const fd = new FormData();
    fd.set("title", newColTitle.trim());
    fd.set("color", newColColor);
    setNewColTitle("");
    setAddingColOpen(false);
    act(() => addRetroColumn(board.id, fd));
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;
    const fd = new FormData();
    fd.set("title", actionTitle.trim());
    fd.set("assigneeId", actionAssigneeId);
    if (actionDueDate) fd.set("dueDate", actionDueDate);
    setActionTitle("");
    setActionDueDate("");
    act(() => addRetroActionItem(board.id, fd));
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const activePhaseIdx = RETRO_PHASES.indexOf(board.phase);

  return (
    <PageShell variant="app">
      {/* Верхняя шапка доски */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Левая часть: назад + название доски + бейджи проекта и спринта */}
          <div className="flex min-w-0 items-center gap-3">
            {!currentUser.isGuest ? (
              <Link
                href={`/project/${board.projectId}/retro`}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                title={t("backToProjectRetros")}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </Link>
            ) : (
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </span>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50">
                  {board.title}
                </h1>
                <Badge tone="neutral" size="xs">
                  {board.projectName}
                </Badge>
                {sprintContext && (
                  <button
                    type="button"
                    onClick={() => setSprintDrawerOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                      />
                    </svg>
                    {sprintContext.name} ({sprintContext.totalSp} SP)
                  </button>
                )}
                {board.isAnonymous && (
                  <Badge tone="warning" size="xs">
                    {t("anonymousBadge")}
                  </Badge>
                )}
                {isCompleted && (
                  <Badge tone="success" size="xs">
                    {t("completedBadge")}
                  </Badge>
                )}
              </div>

              {/* Присутствие онлайн и индикатор печати */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t("onlineCount", { count: onlineParticipants.length })}:{" "}
                  <span className="max-w-xs truncate font-medium text-zinc-700 dark:text-zinc-300">
                    {onlineParticipants.map((p) => p.name).join(", ")}
                  </span>
                </span>
                {typingParticipants.length > 0 && (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600 animate-pulse dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t("typingIndicator", {
                      count: typingParticipants.length,
                      names: typingParticipants.map((p) => p.name).join(", "),
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Правая часть: экспорт, поделиться, настройки, выход */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                />
              </svg>
              {t("shareButton")}
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {mdCopied ? t("markdownCopied") : t("exportMarkdown")}
            </button>

            <button
              type="button"
              onClick={() => downloadRetroCsv(state)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {t("exportCsv")}
            </button>

            {isFacilitator && (
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                title={t("boardSettings")}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              </button>
            )}

            {currentUser.isGuest && (
              <form action={() => leaveRetroBoard(board.inviteToken)}>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t("leaveBoard")}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Панель фасилитации: степпер 5 фаз + таймер + контролы */}
        <div className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
          {/* Степпер фаз */}
          <div className="flex flex-wrap items-center gap-1.5">
            {RETRO_PHASES.map((ph, idx) => {
              const isCurrent = board.phase === ph;
              const isPast = idx < activePhaseIdx;
              return (
                <button
                  key={ph}
                  type="button"
                  disabled={!isFacilitator || isPending}
                  onClick={() => act(() => setRetroPhase(board.id, ph))}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
                      : isPast
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                  } ${!isFacilitator ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span>{t(`phase_${ph}` as "phase_COLLECT")}</span>
                </button>
              );
            })}
          </div>

          {/* Правая сторона панели фасилитации: статус голосов / раскрытие карточек / таймер */}
          <div className="flex flex-wrap items-center gap-2.5">
            {board.phase === "COLLECT" &&
              board.hideCardsUntilReveal &&
              isFacilitator && (
                <button
                  type="button"
                  onClick={() =>
                    act(() =>
                      toggleRevealRetroCards(board.id, !board.cardsRevealed),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                >
                  {board.cardsRevealed
                    ? t("hideCardsAgain")
                    : t("revealAllCards")}
                </button>
              )}

            {board.phase === "VOTE" && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <span>
                  {t("votesRemaining", {
                    remaining: currentUser.remainingVotes,
                    max: board.maxVotesPerUser,
                  })}
                </span>
              </div>
            )}

            {/* Синхронный таймер */}
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 dark:border-zinc-700 dark:bg-zinc-800/80">
              <svg
                className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              {remainingSec !== null ? (
                <span
                  className={`font-mono text-xs font-bold tabular-nums ${
                    remainingSec === 0
                      ? "text-red-600 animate-pulse dark:text-red-400"
                      : remainingSec <= 30
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {formatTimer(remainingSec)}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">{t("timerIdle")}</span>
              )}

              {isFacilitator && !isCompleted && (
                <div className="ml-1 flex items-center gap-1 border-l border-zinc-200 pl-1.5 dark:border-zinc-700">
                  {[180, 300, 600].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() =>
                        act(() => controlRetroTimer(board.id, "start", sec))
                      }
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {sec / 60}m
                    </button>
                  ))}
                  {remainingSec !== null && (
                    <button
                      type="button"
                      onClick={() =>
                        act(() => controlRetroTimer(board.id, "stop"))
                      }
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Всплывающая подсказка об ошибке / действии */}
      {actionToast && (
        <div className="fixed right-4 bottom-4 z-50 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          {actionToast}
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        {/* Подсказка по текущей фазе */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span>
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              {t(`phase_${board.phase}` as "phase_COLLECT")}:
            </strong>{" "}
            {t(`phaseHint_${board.phase}` as "phaseHint_COLLECT")}
          </span>
          {isFacilitator && !isCompleted && (
            <button
              type="button"
              onClick={() => setAddingColOpen((v) => !v)}
              className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              + {t("addColumnButton")}
            </button>
          )}
        </div>

        {/* Шторка контекста спринта (если выбран спринт) */}
        {sprintDrawerOpen && sprintContext && (
          <Card variant="default" className="border-blue-200 dark:border-blue-900">
            <div className="flex items-center justify-between gap-2 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {t("sprintContextTitle", { name: sprintContext.name })}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(sprintContext.startDate).toLocaleDateString()} —{" "}
                  {new Date(sprintContext.endDate).toLocaleDateString()} ·{" "}
                  {t("sprintTicketsCount", {
                    count: sprintContext.ticketCount,
                  })}{" "}
                  · {sprintContext.totalSp} SP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSprintDrawerOpen(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                {tc("close")}
              </button>
            </div>
            {sprintContext.tickets.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sprintContext.tickets.map((tk) => (
                  <div
                    key={tk.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-800/50"
                  >
                    <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                      {tk.externalId ? `[${tk.externalId}] ` : ""}
                      {tk.title}
                    </span>
                    {tk.storyPoints != null && (
                      <Badge tone="info" size="xs">
                        {tk.storyPoints} SP
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">{t("noTicketsInSprint")}</p>
            )}
          </Card>
        )}

        {/* Форма добавления новой колонки */}
        {addingColOpen && isFacilitator && (
          <Card variant="compact">
            <form
              onSubmit={handleAddColumn}
              className="flex flex-wrap items-center gap-3"
            >
              <Input
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                placeholder={t("columnTitlePlaceholder")}
                size="sm"
                className="max-w-xs flex-1"
              />
              <div className="flex items-center gap-1.5">
                {RETRO_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewColColor(col)}
                    className={`h-6 w-6 rounded-full ${COLUMN_ACCENTS[col].dot} ${
                      newColColor === col
                        ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-900"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    aria-label={col}
                  />
                ))}
              </div>
              <Button type="submit" variant="primary" size="sm">
                {tc("save")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAddingColOpen(false)}
              >
                {tc("cancel")}
              </Button>
            </form>
          </Card>
        )}

        {/* Настройки доски (для фасилитатора) */}
        {settingsOpen && isFacilitator && (
          <BoardSettingsPanel
            board={board}
            sprints={sprints}
            onClose={() => setSettingsOpen(false)}
            onSave={(fd) => {
              setSettingsOpen(false);
              act(() => updateRetroSettings(board.id, fd));
            }}
          />
        )}

        {/* Блок Carry-Over Action Items (перенос действий из прошлых ретро команды) */}
        {carryOverItems.length > 0 && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="warning" size="xs">
                  {t("carryOverBadge")}
                </Badge>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t("carryOverTitle")}
                </h2>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  (
                  {
                    carryOverItems.filter((item) => item.status === "DONE")
                      .length
                  }
                  /{carryOverItems.length} {t("completedShort")})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCarryOverExpanded((v) => !v)}
                className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400"
              >
                {carryOverExpanded ? t("hideSection") : t("showSection")}
              </button>
            </div>

            {carryOverExpanded && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {carryOverItems.map((item) => {
                  const done = item.status === "DONE";
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                        done
                          ? "border-zinc-200 bg-white/60 text-zinc-400 line-through dark:border-zinc-800 dark:bg-zinc-900/40"
                          : "border-amber-200 bg-white text-zinc-800 dark:border-amber-800/60 dark:bg-zinc-900 dark:text-zinc-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() =>
                          act(() => toggleRetroActionItem(item.id))
                        }
                        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium break-words">{item.title}</p>
                        <p className="mt-0.5 text-[11px] text-zinc-400 no-underline">
                          {item.fromBoardTitle}
                          {item.assigneeName ? ` · @${item.assigneeName}` : ""}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Spotlight фокуса обсуждения (на фазе DISCUSS) */}
        {(focusedCard || focusedGroup) && (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 p-4 shadow-md dark:border-emerald-500 dark:bg-emerald-950/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                  {t("currentlyDiscussing")}
                </span>
                <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {focusedGroup ? focusedGroup.title : focusedCard?.content}
                </p>
              </div>
              {isFacilitator && (
                <button
                  type="button"
                  onClick={() => act(() => setRetroFocus(board.id, null))}
                  className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-zinc-900 dark:text-emerald-300"
                >
                  {t("clearFocus")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Сетка колонок ретро-доски */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(Math.max(columns.length, 1), 4)}, minmax(260px, 1fr))`,
            }}
          >
            {columns.map((col) => {
              const colGroups = [...groups.filter((g) => g.columnId === col.id)];
              const colCards = [
                ...cards.filter((c) => c.columnId === col.id && !c.groupId),
              ];

              if (shouldSortByVotes) {
                colGroups.sort((a, b) => b.totalVotes - a.totalVotes);
                colCards.sort((a, b) => b.totalVotes - a.totalVotes);
              }

              return (
                <RetroColumnCard
                  key={col.id}
                  column={col}
                  allColumns={columns}
                  groups={colGroups}
                  ungroupedCards={colCards}
                  allCards={cards}
                  phase={board.phase}
                  focusedItemId={board.focusedItemId}
                  isFacilitator={isFacilitator}
                  remainingVotes={currentUser.remainingVotes}
                  canDeleteColumn={columns.length > 1}
                  onMarkTyping={markTyping}
                  onAddCard={(content) =>
                    act(() => addRetroCard(board.id, col.id, content))
                  }
                  onUpdateCard={(cardId, content) =>
                    act(() => updateRetroCard(cardId, content))
                  }
                  onDeleteCard={(cardId) => act(() => deleteRetroCard(cardId))}
                  onMoveCard={(cardId, targetColId, targetGrpId) =>
                    act(() => moveRetroCard(cardId, targetColId, targetGrpId))
                  }
                  onMergeCards={(sourceId, targetId) =>
                    act(() => mergeRetroCards(sourceId, targetId))
                  }
                  onRenameGroup={(groupId, title) =>
                    act(() => updateRetroGroup(groupId, title))
                  }
                  onUngroup={(groupId) => act(() => ungroupRetroCards(groupId))}
                  onVote={(targetType, targetId, delta) =>
                    act(() =>
                      adjustRetroVote(board.id, targetType, targetId, delta),
                    )
                  }
                  onFocus={(itemId) =>
                    act(() =>
                      setRetroFocus(
                        board.id,
                        board.focusedItemId === itemId ? null : itemId,
                      ),
                    )
                  }
                  onUpdateColumn={(fd) =>
                    act(() => updateRetroColumn(col.id, fd))
                  }
                  onDeleteColumn={() => act(() => deleteRetroColumn(col.id))}
                />
              );
            })}
          </div>
        </DndContext>

        {/* Секция Action Items ретро и мост в тикеты планера */}
        <Card
          variant="default"
          className={
            board.phase === "ACTIONS"
              ? "border-2 border-emerald-500 ring-4 ring-emerald-500/10"
              : ""
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {t("actionItemsSectionTitle")} ({actionItems.length})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("actionItemsSectionDesc")}
              </p>
            </div>

            {!currentUser.isGuest && sprints.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {t("convertTargetLabel")}
                </span>
                <select
                  value={ticketTargetSprint}
                  onChange={(e) => setTicketTargetSprint(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="__BACKLOG__">{t("targetBacklog")}</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.isActive ? ` (${t("activeSprintTag")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!isCompleted && (
            <form
              onSubmit={handleAddActionItem}
              className="mb-4 grid gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 sm:grid-cols-12 dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder={t("actionTitlePlaceholder")}
                  maxLength={300}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={actionAssigneeId}
                  onChange={(e) => setActionAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="__NONE__">{t("unassignedOption")}</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="date"
                  value={actionDueDate}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="sm:col-span-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  block
                  disabled={isPending || !actionTitle.trim()}
                >
                  +
                </Button>
              </div>
            </form>
          )}

          {actionItems.length === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-400">
              {t("noActionItemsYet")}
            </p>
          ) : (
            <div className="space-y-2">
              {actionItems.map((item) => {
                const done = item.status === "DONE";
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() =>
                          act(() => toggleRetroActionItem(item.id))
                        }
                        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            done
                              ? "text-zinc-400 line-through"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {item.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {item.assigneeName && (
                            <Badge tone="neutral" size="xs">
                              @{item.assigneeName}
                            </Badge>
                          )}
                          {item.dueDate && (
                            <span>
                              {t("dueLabel", {
                                date: new Date(
                                  item.dueDate,
                                ).toLocaleDateString(),
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>

                    <div className="flex items-center gap-2">
                      {item.ticketId ? (
                        <Link
                          href={`/project/${board.projectId}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                        >
                          ✓ {t("linkedTicketBadge")}
                        </Link>
                      ) : (
                        !currentUser.isGuest && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              act(() =>
                                convertActionItemToTicket(
                                  item.id,
                                  ticketTargetSprint,
                                ),
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                          >
                            → {t("convertToTicketButton")}
                          </button>
                        )
                      )}

                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() =>
                            act(() => deleteRetroActionItem(item.id))
                          }
                          className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          aria-label={tc("delete")}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <RetroQrModal
        inviteToken={board.inviteToken}
        boardTitle={board.title}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column Component
// ─────────────────────────────────────────────────────────────────────────────

interface ColumnCardProps {
  column: RetroColumnItem;
  allColumns: RetroColumnItem[];
  groups: RetroGroupItem[];
  ungroupedCards: RetroCardItem[];
  allCards: RetroCardItem[];
  phase: RetroPhase;
  focusedItemId: string | null;
  isFacilitator: boolean;
  remainingVotes: number;
  canDeleteColumn: boolean;
  onMarkTyping: () => void;
  onAddCard: (content: string) => void;
  onUpdateCard: (cardId: string, content: string) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (
    cardId: string,
    targetColumnId: string,
    targetGroupId: string | null,
  ) => void;
  onMergeCards: (sourceCardId: string, targetCardId: string) => void;
  onRenameGroup: (groupId: string, title: string) => void;
  onUngroup: (groupId: string) => void;
  onVote: (
    targetType: "card" | "group",
    targetId: string,
    delta: 1 | -1,
  ) => void;
  onFocus: (itemId: string) => void;
  onUpdateColumn: (fd: FormData) => void;
  onDeleteColumn: () => void;
}

function RetroColumnCard({
  column,
  allColumns,
  groups,
  ungroupedCards,
  allCards,
  phase,
  focusedItemId,
  isFacilitator,
  remainingVotes,
  canDeleteColumn,
  onMarkTyping,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onMergeCards,
  onRenameGroup,
  onUngroup,
  onVote,
  onFocus,
  onUpdateColumn,
  onDeleteColumn,
}: ColumnCardProps) {
  const t = useTranslations("retro");
  const tc = useTranslations("common");
  const [newCardText, setNewCardText] = useState("");
  const [editingCol, setEditingCol] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);
  const [colColor, setColColor] = useState<RetroColumnColor>(column.color);

  const { setNodeRef, isOver } = useDroppable({
    id: `col:${column.id}`,
  });

  const accent = COLUMN_ACCENTS[column.color] ?? COLUMN_ACCENTS.emerald;
  const canAddCards =
    phase !== "COMPLETED" && (phase === "COLLECT" || isFacilitator);

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardText.trim()) return;
    onAddCard(newCardText.trim());
    setNewCardText("");
  };

  const handleSaveColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("title", colTitle.trim() || column.title);
    fd.set("color", colColor);
    setEditingCol(false);
    onUpdateColumn(fd);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border bg-white/90 transition-all dark:bg-zinc-900/90 ${
        accent.border
      } ${isOver ? "ring-2 ring-emerald-500" : ""}`}
    >
      {/* Заголовок колонки */}
      <div
        className={`rounded-t-2xl border-b px-4 py-3 ${accent.headerBg} ${accent.border}`}
      >
        {editingCol ? (
          <form onSubmit={handleSaveColumn} className="space-y-2">
            <input
              type="text"
              value={colTitle}
              onChange={(e) => setColTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {RETRO_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColColor(c)}
                    className={`h-4 w-4 rounded-full ${COLUMN_ACCENTS[c].dot} ${
                      colColor === c ? "ring-2 ring-zinc-900 dark:ring-white" : ""
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {canDeleteColumn && (
                  <button
                    type="button"
                    onClick={onDeleteColumn}
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:text-red-400"
                  >
                    {tc("delete")}
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {tc("save")}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${accent.dot}`} />
              <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {column.title}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${accent.badge}`}
              >
                {
                  allCards.filter((c) => c.columnId === column.id).length
                }
              </span>
            </div>
            {isFacilitator && phase !== "COMPLETED" && (
              <button
                type="button"
                onClick={() => setEditingCol(true)}
                className="rounded p-1 text-zinc-400 hover:bg-white/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title={t("editColumn")}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Инпут добавления карточки (в фазе COLLECT) */}
      {canAddCards && (
        <form onSubmit={handleCreateCard} className="border-b border-zinc-100 p-3 dark:border-zinc-800">
          <textarea
            rows={2}
            value={newCardText}
            onChange={(e) => {
              setNewCardText(e.target.value);
              onMarkTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCreateCard(e);
              }
            }}
            placeholder={t("addCardPlaceholder", { column: column.title })}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:focus:bg-zinc-800"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">
              {t("enterToSubmitHint")}
            </span>
            <button
              type="submit"
              disabled={!newCardText.trim()}
              className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white transition-opacity disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              + {t("addCardButton")}
            </button>
          </div>
        </form>
      )}

      {/* Список групп и карточек в колонке */}
      <div className="flex-1 space-y-2.5 p-3">
        {groups.map((grp) => {
          const grpCards = allCards.filter((c) => c.groupId === grp.id);
          return (
            <RetroGroupBox
              key={grp.id}
              group={grp}
              cards={grpCards}
              phase={phase}
              isFocused={focusedItemId === grp.id}
              isFacilitator={isFacilitator}
              remainingVotes={remainingVotes}
              onRename={(title) => onRenameGroup(grp.id, title)}
              onUngroup={() => onUngroup(grp.id)}
              onVote={(delta) => onVote("group", grp.id, delta)}
              onFocus={() => onFocus(grp.id)}
              onRemoveCardFromGroup={(cardId) =>
                onMoveCard(cardId, column.id, null)
              }
            />
          );
        })}

        {ungroupedCards.map((card) => (
          <RetroCardBox
            key={card.id}
            card={card}
            allColumns={allColumns}
            otherCardsInBoard={allCards.filter(
              (c) => c.id !== card.id && !c.isBlurred,
            )}
            phase={phase}
            isFocused={focusedItemId === card.id}
            isFacilitator={isFacilitator}
            remainingVotes={remainingVotes}
            onUpdate={(content) => onUpdateCard(card.id, content)}
            onDelete={() => onDeleteCard(card.id)}
            onMoveToColumn={(targetColId) =>
              onMoveCard(card.id, targetColId, null)
            }
            onMergeWithCard={(targetCardId) =>
              onMergeCards(card.id, targetCardId)
            }
            onVote={(delta) => onVote("card", card.id, delta)}
            onFocus={() => onFocus(card.id)}
          />
        ))}

        {groups.length === 0 && ungroupedCards.length === 0 && (
          <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            {t("emptyColumnText")}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Group Box Component
// ─────────────────────────────────────────────────────────────────────────────

function RetroGroupBox({
  group,
  cards,
  phase,
  isFocused,
  isFacilitator,
  remainingVotes,
  onRename,
  onUngroup,
  onVote,
  onFocus,
  onRemoveCardFromGroup,
}: {
  group: RetroGroupItem;
  cards: RetroCardItem[];
  phase: RetroPhase;
  isFocused: boolean;
  isFacilitator: boolean;
  remainingVotes: number;
  onRename: (title: string) => void;
  onUngroup: () => void;
  onVote: (delta: 1 | -1) => void;
  onFocus: () => void;
  onRemoveCardFromGroup: (cardId: string) => void;
}) {
  const t = useTranslations("retro");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(group.title);

  const { setNodeRef, isOver } = useDroppable({
    id: `group:${group.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 bg-zinc-50/90 p-3 transition-all dark:bg-zinc-800/60 ${
        isFocused
          ? "border-emerald-500 ring-2 ring-emerald-500/30"
          : isOver
            ? "border-blue-500"
            : "border-zinc-200 dark:border-zinc-700"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEditing(false);
              onRename(title);
            }}
            className="flex flex-1 items-center gap-1.5"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs font-bold dark:border-zinc-600 dark:bg-zinc-900"
            />
            <button
              type="submit"
              className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              OK
            </button>
          </form>
        ) : (
          <div className="flex min-w-0 items-center gap-1.5">
            <Badge tone="info" size="xs">
              {t("groupBadge", { count: cards.length })}
            </Badge>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="truncate text-xs font-bold text-zinc-900 hover:underline dark:text-zinc-100"
            >
              {group.title}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          {(phase === "GROUP" || isFacilitator) && phase !== "COMPLETED" && (
            <button
              type="button"
              onClick={onUngroup}
              className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
              title={t("ungroupButton")}
            >
              {t("ungroupButton")}
            </button>
          )}
          {phase === "DISCUSS" && isFacilitator && (
            <button
              type="button"
              onClick={onFocus}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                isFocused
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
              }`}
            >
              {t("focusButton")}
            </button>
          )}
        </div>
      </div>

      {/* Вложенные карточки группы */}
      <div className="space-y-1.5">
        {cards.map((c) => (
          <div
            key={c.id}
            className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200/80 bg-white px-2.5 py-2 text-xs text-zinc-800 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <span className="break-words">{c.content}</span>
            {phase === "GROUP" && (
              <button
                type="button"
                onClick={() => onRemoveCardFromGroup(c.id)}
                className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                title={t("DetachCard")}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Голосование за группу */}
      <VoteControlsRow
        phase={phase}
        myVotes={group.myVotes}
        totalVotes={group.totalVotes}
        remainingVotes={remainingVotes}
        onVote={onVote}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Card Component (Draggable & Droppable for grouping)
// ─────────────────────────────────────────────────────────────────────────────

function RetroCardBox({
  card,
  allColumns,
  otherCardsInBoard,
  phase,
  isFocused,
  isFacilitator,
  remainingVotes,
  onUpdate,
  onDelete,
  onMoveToColumn,
  onMergeWithCard,
  onVote,
  onFocus,
}: {
  card: RetroCardItem;
  allColumns: RetroColumnItem[];
  otherCardsInBoard: RetroCardItem[];
  phase: RetroPhase;
  isFocused: boolean;
  isFacilitator: boolean;
  remainingVotes: number;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onMoveToColumn: (colId: string) => void;
  onMergeWithCard: (targetCardId: string) => void;
  onVote: (delta: 1 | -1) => void;
  onFocus: () => void;
}) {
  const t = useTranslations("retro");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.content);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);

  const canDrag =
    !card.isBlurred &&
    phase !== "COMPLETED" &&
    (phase === "GROUP" || isFacilitator);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `card:${card.id}`,
    disabled: !canDrag || editing,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `card:${card.id}`,
    disabled: !canDrag,
  });

  const setRefs = (el: HTMLDivElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const canEdit =
    !card.isBlurred &&
    phase !== "COMPLETED" &&
    (card.isOwn || isFacilitator);

  return (
    <div
      ref={setRefs}
      style={style}
      {...(canDrag && !editing ? { ...attributes, ...listeners } : {})}
      className={`group relative rounded-xl border bg-white p-3 shadow-xs transition-all dark:bg-zinc-900 ${
        isFocused
          ? "border-2 border-emerald-500 ring-2 ring-emerald-500/25"
          : isOver
            ? "border-2 border-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      } ${isDragging ? "z-30 opacity-60 shadow-xl" : ""} ${
        canDrag && !editing ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setEditing(false);
            onUpdate(text);
          }}
          className="space-y-2"
        >
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded px-2 py-0.5 text-[11px] text-zinc-500"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              className="rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white"
            >
              {tc("save")}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p
            className={`text-xs leading-relaxed break-words ${
              card.isBlurred
                ? "select-none blur-[5px] text-zinc-400 dark:text-zinc-500"
                : "text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {card.content}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              {card.isBlurred ? (
                <span className="italic">{t("hiddenUntilReveal")}</span>
              ) : (
                card.authorName && <span>{card.authorName}</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setText(card.content);
                      setEditing(true);
                    }}
                    className="rounded p-1 text-zinc-400 opacity-80 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title={t("editCard")}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded p-1 text-zinc-400 opacity-80 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    title={tc("delete")}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </>
              )}

              {/* Мобильно-дружелюбная кнопка группировки/перемещения на фазе GROUP */}
              {phase === "GROUP" && !card.isBlurred && (
                <button
                  type="button"
                  onClick={() => setGroupMenuOpen((v) => !v)}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {t("groupActionShort")}
                </button>
              )}

              {phase === "DISCUSS" && isFacilitator && (
                <button
                  type="button"
                  onClick={onFocus}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    isFocused
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {t("focusButton")}
                </button>
              )}
            </div>
          </div>

          {/* Выпадающее меню быстрого перемещения/объединения (удобно на тач-экранах) */}
          {groupMenuOpen && phase === "GROUP" && (
            <div className="mt-2 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-800">
              <div>
                <p className="mb-1 font-semibold text-zinc-500">
                  {t("moveToColumnLabel")}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {allColumns
                    .filter((c) => c.id !== card.columnId)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setGroupMenuOpen(false);
                          onMoveToColumn(c.id);
                        }}
                        className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-zinc-700 hover:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        → {c.title}
                      </button>
                    ))}
                </div>
              </div>
              {otherCardsInBoard.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-zinc-500">
                    {t("mergeWithCardLabel")}:
                  </p>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      setGroupMenuOpen(false);
                      onMergeWithCard(e.target.value);
                    }}
                    className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    <option value="">{t("selectCardToGroup")}</option>
                    {otherCardsInBoard.slice(0, 20).map((oc) => (
                      <option key={oc.id} value={oc.id}>
                        {oc.content.slice(0, 45)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Панель голосования */}
          {!card.isBlurred && (
            <VoteControlsRow
              phase={phase}
              myVotes={card.myVotes}
              totalVotes={card.totalVotes}
              remainingVotes={remainingVotes}
              onVote={onVote}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vote Controls Row
// ─────────────────────────────────────────────────────────────────────────────

function VoteControlsRow({
  phase,
  myVotes,
  totalVotes,
  remainingVotes,
  onVote,
}: {
  phase: RetroPhase;
  myVotes: number;
  totalVotes: number;
  remainingVotes: number;
  onVote: (delta: 1 | -1) => void;
}) {
  if (phase === "COLLECT" || phase === "GROUP") return null;

  if (phase === "VOTE") {
    return (
      <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          {Array.from({ length: myVotes }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"
            />
          ))}
          {myVotes === 0 && (
            <span className="text-[10px] text-zinc-400">0</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {myVotes > 0 && (
            <button
              type="button"
              onClick={() => onVote(-1)}
              className="flex h-5 w-5 items-center justify-center rounded border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              −
            </button>
          )}
          <button
            type="button"
            disabled={remainingVotes <= 0}
            onClick={() => onVote(1)}
            className="flex h-5 items-center gap-1 rounded bg-blue-50 px-2 text-[11px] font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-40 dark:bg-blue-950/60 dark:text-blue-300"
          >
            +1
          </button>
        </div>
      </div>
    );
  }

  // DISCUSS, ACTIONS, COMPLETED — показываем итоговые голоса
  return (
    <div className="mt-2 flex items-center justify-end border-t border-zinc-100 pt-1.5 dark:border-zinc-800">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          totalVotes > 0
            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {totalVotes}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Board Settings Panel (Facilitator)
// ─────────────────────────────────────────────────────────────────────────────

function BoardSettingsPanel({
  board,
  sprints,
  onClose,
  onSave,
}: {
  board: {
    title: string;
    isAnonymous: boolean;
    hideCardsUntilReveal: boolean;
    hideVotesUntilDone: boolean;
    maxVotesPerUser: number;
    sprintId: string | null;
  };
  sprints: { id: string; name: string; isActive: boolean }[];
  onClose: () => void;
  onSave: (fd: FormData) => void;
}) {
  const t = useTranslations("retro");
  const tc = useTranslations("common");
  const [title, setTitle] = useState(board.title);
  const [isAnonymous, setIsAnonymous] = useState(board.isAnonymous);
  const [hideCardsUntilReveal, setHideCardsUntilReveal] = useState(
    board.hideCardsUntilReveal,
  );
  const [hideVotesUntilDone, setHideVotesUntilDone] = useState(
    board.hideVotesUntilDone,
  );
  const [maxVotesPerUser, setMaxVotesPerUser] = useState(
    board.maxVotesPerUser,
  );
  const [sprintId, setSprintId] = useState(board.sprintId ?? "__NONE__");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("title", title.trim() || board.title);
    fd.set("isAnonymous", String(isAnonymous));
    fd.set("hideCardsUntilReveal", String(hideCardsUntilReveal));
    fd.set("hideVotesUntilDone", String(hideVotesUntilDone));
    fd.set("maxVotesPerUser", String(maxVotesPerUser));
    fd.set("sprintId", sprintId);
    onSave(fd);
  };

  return (
    <Card variant="default">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {t("boardSettings")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-700"
          >
            {tc("close")}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("boardTitleLabel")}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("linkedSprintLabel")}
            </label>
            <select
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="__NONE__">{t("noSprintOption")}</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t("votesPerUserLabel")}
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={maxVotesPerUser}
              onChange={(e) =>
                setMaxVotesPerUser(
                  Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 5)),
                )
              }
              size="sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hideCardsUntilReveal}
              onChange={(e) => setHideCardsUntilReveal(e.target.checked)}
              className="rounded border-zinc-300 text-emerald-600"
            />
            <span>{t("privateWritingLabel")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-zinc-300 text-emerald-600"
            />
            <span>{t("anonymousModeLabel")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hideVotesUntilDone}
              onChange={(e) => setHideVotesUntilDone(e.target.checked)}
              className="rounded border-zinc-300 text-emerald-600"
            />
            <span>{t("hideVotesLabel")}</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {tc("save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
