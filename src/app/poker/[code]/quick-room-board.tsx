"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useEstimationPolling,
  type SessionTicket,
  type VoteProgress,
  type VoterStatus,
} from "@/hooks/use-estimation-polling";
import { VotingForm } from "@/components/estimation/voting-form";
import { VotingResults } from "@/components/estimation/voting-results";
import { VoteDetails } from "@/components/estimation/vote-details";
import {
  startNextRound,
  changeQuickRoomMethod,
  leaveQuickRoom,
} from "@/app/actions/quick-room";
import { revealVotes, restartVoting } from "@/app/actions/estimation";
import { QrCodeModal } from "@/components/quick-room/qr-code-modal";
import { PageShell, LoadingScreen } from "@/components/ui";

type Method = "FIBONACCI_SP" | "HOURS" | "DAYS" | "COMPOSITE_SP";

interface Props {
  projectId: string;
  accessCode: string;
}

function ButtonSpinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-current ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  );
}

export function QuickRoomBoard({ projectId, accessCode }: Props) {
  const t = useTranslations("quickRoom");
  const tc = useTranslations("common");
  const { state, refresh, optimisticUpdate, markVotedOptimistic } =
    useEstimationPolling(projectId, 5000);
  const [isPending, startTransition] = useTransition();
  const [linkCopied, setLinkCopied] = useState(false);
  const [methodMenuOpen, setMethodMenuOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [methodToast, setMethodToast] = useState<string | null>(null);
  const [prevMethod, setPrevMethod] = useState<string | null>(null);

  const isHost = state?.quickRoom?.isHost ?? false;
  const currentMethod = state?.estimationConfig.method ?? null;

  if (currentMethod && currentMethod !== prevMethod) {
    setPrevMethod(currentMethod);
    if (prevMethod !== null) {
      setMethodToast(currentMethod);
    }
  }

  // Toast: метод изменился — авто-скрытие через 3.5с
  useEffect(() => {
    if (!methodToast) return;
    const timer = setTimeout(() => setMethodToast(null), 3500);
    return () => clearTimeout(timer);
  }, [methodToast]);

  const act = useCallback(
    (action: () => Promise<unknown>) => {
      startTransition(async () => {
        await action();
        await refresh();
      });
    },
    [refresh],
  );

  const handleVoteSuccess = useCallback(async () => {
    markVotedOptimistic();
    await refresh();
  }, [markVotedOptimistic, refresh]);

  const handleRestartVoting = useCallback(() => {
    optimisticUpdate((prev) => ({
      ...prev,
      status: "VOTING",
      votes: {
        ...prev.votes,
        submittedCount: 0,
        currentUserVoted: false,
      },
      voterStatus: prev.voterStatus
        ? prev.voterStatus.map((v) => ({ ...v, voted: false }))
        : null,
      results: null,
      individualVotes: null,
    }));
    act(() => restartVoting(projectId));
  }, [act, optimisticUpdate, projectId]);

  const copyLink = useCallback(() => {
    const url = `${window.location.origin}/poker/${accessCode}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [accessCode]);

  if (!state) {
    return <LoadingScreen label={tc("loading")} />;
  }

  const method = state.estimationConfig.method as Method;

  return (
    <PageShell variant="app">
      {/* Toast: смена метода — fade-out через ~3.5с */}
      {methodToast && (
        <div className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-lg dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-200">
            {t("methodChangedToast", { method: t(`methodShort_${methodToast}`) })}
          </div>
        </div>
      )}

      {/* HEADER: код комнаты, ник, копировать ссылку */}
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/poker"
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
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {t("roomCode")}
              </p>
              <p className="font-mono text-lg font-bold tracking-wider text-zinc-900 dark:text-zinc-50">
                {accessCode}
              </p>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="ml-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500"
            >
              {linkCopied ? t("linkCopied") : t("copyLink")}
            </button>
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              title={t("qrTitle")}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5C19.746 3.75 20.25 4.254 20.25 4.875v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{t("youAre", { name: state.currentUser.name })}</span>
            {isHost && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {t("hostBadge")}
              </span>
            )}
            {!isHost && (
              <button
                type="button"
                onClick={() => act(() => leaveQuickRoom(accessCode))}
                disabled={isPending}
                className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {t("leave")}
              </button>
            )}
          </div>
        </div>
      </header>
      <QrCodeModal accessCode={accessCode} open={qrOpen} onClose={() => setQrOpen(false)} />

      {/* Method switcher (только хост) */}
      {isHost && (
        <div className="border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("currentMethod")}:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {t(`methodShort_${method}`)}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setMethodMenuOpen((v) => !v)}
              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {methodMenuOpen ? tc("close") : t("changeMethod")}
            </button>
          </div>
          {methodMenuOpen && (
            <div className="mx-auto mt-2 grid max-w-5xl grid-cols-2 gap-2 md:grid-cols-4">
              {(["FIBONACCI_SP", "HOURS", "DAYS", "COMPOSITE_SP"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={isPending || m === method}
                  onClick={() =>
                    act(async () => {
                      await changeQuickRoomMethod(accessCode, m);
                      setMethodMenuOpen(false);
                    })
                  }
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    method === m
                      ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  {t(`methodShort_${m}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-4 md:p-8">
          {state.status === "IDLE" && (
            <IdleState
              isHost={isHost}
              onStart={() => act(() => startNextRound(accessCode))}
              isPending={isPending}
            />
          )}

          {state.status === "VOTING" && state.activeTicket && (
            <>
              <RoundHeader ticket={state.activeTicket} />
              {!state.votes.currentUserVoted && (
                <div className={isHost ? "mb-6" : ""}>
                  <VotingForm
                    key={`${state.activeTicket.id}-${state.estimationConfig.method}`}
                    projectId={projectId}
                    config={state.estimationConfig}
                    spScale={state.spScale}
                    onSuccess={handleVoteSuccess}
                    onCustomValueChange={refresh}
                  />
                </div>
              )}
              {state.votes.currentUserVoted && !isHost && (
                <WaitingPanel votes={state.votes} />
              )}
              {isHost && (
                <HostVotingPanel
                  votes={state.votes}
                  voterStatus={state.voterStatus}
                  onReveal={() => act(() => revealVotes(projectId))}
                  isPending={isPending}
                />
              )}
            </>
          )}

          {state.status === "REVEALED" && state.activeTicket && state.results && (
            <>
              <RoundHeader ticket={state.activeTicket} />
              <VotingResults
                results={state.results}
                workingHoursPerDay={state.estimationConfig.workingHoursPerDay}
              />
              {state.individualVotes && state.individualVotes.length > 0 && (
                <div className="mt-5">
                  <VoteDetails
                    votes={state.individualVotes}
                    results={state.results}
                    isSM={isHost}
                    estimationConfig={state.estimationConfig}
                    projectId={projectId}
                    onRefresh={refresh}
                  />
                </div>
              )}
              {isHost && (
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => act(() => startNextRound(accessCode))}
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {isPending && <ButtonSpinner />}
                    <span>{t("nextRound")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestartVoting}
                    disabled={isPending}
                    className="rounded-xl border border-zinc-300 px-5 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {t("revote")}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Guest upgrade hint — только для guest-юзеров.
              Для зарегистрированных в Quick Room не показываем (они уже знают). */}
          {state.currentUser.isGuest && (
            <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("guestHintTitle")}
              </p>
              <Link
                href="/register"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t("guestHintAction")}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}

function IdleState({
  isHost,
  onStart,
  isPending,
}: {
  isHost: boolean;
  onStart: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("quickRoom");
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <svg
          className="h-8 w-8 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        {isHost ? t("idleHostTitle") : t("idleGuestTitle")}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {isHost ? t("idleHostDesc") : t("idleGuestDesc")}
      </p>
      {isHost && (
        <button
          type="button"
          onClick={onStart}
          disabled={isPending}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isPending ? t("starting") : t("startFirstRound")}
        </button>
      )}
    </div>
  );
}

function RoundHeader({ ticket }: { ticket: SessionTicket }) {
  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
        {ticket.title}
      </h2>
    </div>
  );
}

function HostVotingPanel({
  votes,
  voterStatus,
  onReveal,
  isPending,
}: {
  votes: VoteProgress;
  voterStatus: VoterStatus[] | null;
  onReveal: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("quickRoom");
  const te = useTranslations("estimation");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
        {te("voting")}
      </h3>
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {te("progress")}
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {votes.submittedCount} / {votes.totalVoters}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{
              width: `${votes.totalVoters > 0 ? (votes.submittedCount / votes.totalVoters) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      {voterStatus && voterStatus.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {voterStatus.map((v) => (
            <span
              key={v.oderId}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                v.voted
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {v.voted ? (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-40" />
              )}
              {v.name}
            </span>
          ))}
        </div>
      )}
      {votes.totalVoters === 0 && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
          {t("waitingForPlayers")}
        </p>
      )}
      <button
        type="button"
        onClick={onReveal}
        disabled={isPending || votes.submittedCount === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isPending && <ButtonSpinner />}
        <span>
          {isPending
            ? te("processing")
            : votes.submittedCount > 0
              ? te("revealResultsCount", { count: votes.submittedCount })
              : te("revealResults")}
        </span>
      </button>
    </div>
  );
}

function WaitingPanel({ votes }: { votes: VoteProgress }) {
  const t = useTranslations("estimation");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        {t("waitingTeamTitle")}
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {t("waitingTeamDesc")}
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-semibold">{votes.submittedCount}</span>
        <span>{t("of")}</span>
        <span className="font-semibold">{votes.totalVoters}</span>
        <span>{t("voted")}</span>
      </div>
    </div>
  );
}
