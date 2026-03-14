"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  useEstimationPolling,
  type SessionTicket,
  type VoteProgress,
} from "@/hooks/use-estimation-polling";
import { VotingForm } from "./voting-form";
import { VotingResults } from "./voting-results";
import { TicketForm } from "./ticket-form";
import {
  setActiveTicket,
  revealVotes,
  acceptEstimation,
  restartVoting,
  deleteTicket,
} from "@/app/actions/estimation";

const ROLE_LABELS: Record<string, string> = {
  DEV: "Developer",
  QA: "QA Engineer",
  SCRUM_MASTER: "Scrum Master",
};

const ROLE_STYLES: Record<string, string> = {
  DEV: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  QA: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  SCRUM_MASTER:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

export function EstimationBoard({ projectId }: { projectId: string }) {
  const { state, refresh } = useEstimationPolling(projectId, 2000);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const act = useCallback(
    (action: () => Promise<unknown>) => {
      startTransition(async () => {
        await action();
        refresh();
      });
    },
    [refresh],
  );

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-400">
          <svg
            className="h-5 w-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  const isSM = state.currentUser.role === "SCRUM_MASTER";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:px-6 md:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/project/${projectId}`}
              className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Сессия оценки
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-600 dark:text-zinc-300 sm:inline">
              {state.currentUser.name}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[state.currentUser.role] ?? ""}`}
            >
              {ROLE_LABELS[state.currentUser.role] ?? state.currentUser.role}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-80 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Тикеты
            </h2>
            {isSM && (
              <button
                type="button"
                onClick={() => setShowTicketForm((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  {showTicketForm ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  )}
                </svg>
              </button>
            )}
          </div>

          {isSM && showTicketForm && (
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <TicketForm
                projectId={projectId}
                onSuccess={() => {
                  setShowTicketForm(false);
                  refresh();
                }}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {state.tickets.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-zinc-400">
                {isSM ? (
                  <>
                    Нет тикетов.
                    <br />
                    Нажмите{" "}
                    <button type="button" onClick={() => setShowTicketForm(true)} className="text-blue-500 underline">
                      +
                    </button>{" "}
                    чтобы добавить.
                  </>
                ) : (
                  "Нет тикетов. SM добавит тикеты для оценки."
                )}
              </p>
            ) : (
              state.tickets.map((ticket) => {
                const estimated = ticket.storyPoints != null;
                return (
                  <div
                    key={ticket.id}
                    className={`group mb-1 rounded-lg border px-3 py-2.5 transition-colors ${
                      ticket.isActive
                        ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                        : estimated
                          ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                          : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        {estimated && !ticket.isActive && (
                          <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                            <svg className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          {ticket.externalId && (
                            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                              {ticket.externalId}
                            </span>
                          )}
                          <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {ticket.title}
                          </p>
                          {estimated && (
                            <span className="mt-0.5 inline-flex rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                              {ticket.storyPoints} SP
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1">
                        {ticket.isActive ? (
                          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                            Активен
                          </span>
                        ) : isSM ? (
                          <>
                            <button
                              type="button"
                              onClick={() => act(() => setActiveTicket(projectId, ticket.id))}
                              disabled={isPending}
                              className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-all hover:bg-blue-700 group-hover:opacity-100 disabled:opacity-50 dark:bg-blue-500"
                            >
                              {estimated ? "Переоценить" : "Оценить"}
                            </button>
                            <button
                              type="button"
                              onClick={() => act(() => deleteTicket(projectId, ticket.id))}
                              disabled={isPending}
                              className="rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl p-4 md:p-8">
            {state.status === "IDLE" && (
              <IdleState isSM={isSM} hasTickets={state.tickets.length > 0} />
            )}

            {state.status === "VOTING" && state.activeTicket && (
              <>
                <TicketInfo ticket={state.activeTicket} />
                {isSM ? (
                  <SMVotingPanel
                    votes={state.votes}
                    onReveal={() => act(() => revealVotes(projectId))}
                    isPending={isPending}
                  />
                ) : state.votes.currentUserVoted ? (
                  <WaitingForTeam votes={state.votes} />
                ) : (
                  <VotingForm projectId={projectId} onSuccess={refresh} />
                )}
              </>
            )}

            {state.status === "REVEALED" &&
              state.activeTicket &&
              state.results && (
                <>
                  <TicketInfo ticket={state.activeTicket} />
                  <VotingResults results={state.results} />
                  {isSM && (
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => act(() => acceptEstimation(projectId))}
                        disabled={isPending}
                        className="flex-1 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        Принять ({state.results.recommendedSp} SP)
                      </button>
                      <button
                        type="button"
                        onClick={() => act(() => restartVoting(projectId))}
                        disabled={isPending}
                        className="rounded-xl border border-zinc-300 px-5 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Переголосовать
                      </button>
                    </div>
                  )}
                </>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}

function IdleState({ isSM, hasTickets }: { isSM: boolean; hasTickets: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        {isSM ? "Выберите тикет для оценки" : "Ожидание Scrum Master"}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {isSM
          ? hasTickets
            ? "Выберите тикет в боковой панели, чтобы начать оценку"
            : "Добавьте тикеты через боковую панель, чтобы начать"
          : "Scrum Master выберет тикет из списка слева для оценки"}
      </p>
    </div>
  );
}

function TicketInfo({ ticket }: { ticket: SessionTicket }) {
  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2">
        {ticket.externalId &&
          (ticket.externalUrl ? (
            <a href={ticket.externalUrl} target="_blank" rel="noopener noreferrer" className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-blue-950/30">
              {ticket.externalId} ↗
            </a>
          ) : (
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {ticket.externalId}
            </span>
          ))}
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{ticket.title}</h2>
      {ticket.description && (
        <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{ticket.description}</p>
      )}
      {ticket.acceptanceCriteria && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="mb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">Acceptance Criteria</p>
          <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{ticket.acceptanceCriteria}</p>
        </div>
      )}
    </div>
  );
}

function SMVotingPanel({ votes, onReveal, isPending }: { votes: VoteProgress; onReveal: () => void; isPending: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">Голосование</h3>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Прогресс</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{votes.submittedCount} / {votes.totalVoters}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${votes.totalVoters > 0 ? (votes.submittedCount / votes.totalVoters) * 100 : 0}%` }} />
          </div>
        </div>
      </div>
      {votes.totalVoters === 0 && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">Нет участников с ролью Dev/QA для голосования</p>
      )}
      <button type="button" onClick={onReveal} disabled={isPending || votes.submittedCount === 0} className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600">
        {isPending ? "Обработка..." : `Раскрыть результаты${votes.submittedCount > 0 ? ` (${votes.submittedCount})` : ""}`}
      </button>
    </div>
  );
}

function WaitingForTeam({ votes }: { votes: VoteProgress }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex justify-center">
        <svg className="h-10 w-10 animate-pulse text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Ожидание команды</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Ваш голос учтён. Ожидаем остальных участников.</p>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-semibold">{votes.submittedCount}</span>
        <span>из</span>
        <span className="font-semibold">{votes.totalVoters}</span>
        <span>проголосовали</span>
      </div>
    </div>
  );
}
