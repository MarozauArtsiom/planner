"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserMenu } from "@/components/user-menu";
import {
  useEstimationPolling,
  type SessionTicket,
  type VoteProgress,
  type EstimationResults,
  type IndividualVote,
  type VoterStatus,
  type SpScaleOption,
} from "@/hooks/use-estimation-polling";
import { VotingForm } from "./voting-form";
import { VotingResults } from "./voting-results";
import { VoteDetails } from "./vote-details";
import { TicketForm } from "./ticket-form";
import { TicketImportModal } from "./ticket-import-modal";
import {
  setActiveTicket,
  revealVotes,
  acceptEstimation,
  restartVoting,
  deleteTicket,
} from "@/app/actions/estimation";

const ROLE_STYLES: Record<string, string> = {
  DEV: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  QA: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

export function EstimationBoard({ projectId }: { projectId: string }) {
  const t = useTranslations("estimation");
  const tp = useTranslations("project");
  const tc = useTranslations("common");
  const { state, refresh } = useEstimationPolling(projectId, 2000);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedSp, setSelectedSp] = useState<number | null>(null);
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);
  const [ticketStats, setTicketStats] = useState<{
    ticket: { id: string; title: string; externalId: string | null; storyPoints: number | null };
    results: EstimationResults | null;
    individualVotes: IndividualVote[];
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsSp, setStatsSp] = useState<number | null>(null);

  const isSM = state?.currentUser.isScrumMaster ?? false;
  const canVote = !!state?.currentUser.role;

  const act = useCallback(
    (action: () => Promise<unknown>) => {
      startTransition(async () => {
        await action();
        refresh();
      });
    },
    [refresh],
  );

  const openTicketStats = useCallback(
    async (ticketId: string) => {
      setViewingTicketId(ticketId);
      setStatsLoading(true);
      setStatsSp(null);
      try {
        const res = await fetch(
          `/api/estimation/ticket-stats?ticketId=${encodeURIComponent(ticketId)}&projectId=${encodeURIComponent(projectId)}`,
        );
        if (res.ok) {
          setTicketStats(await res.json());
        }
      } finally {
        setStatsLoading(false);
      }
    },
    [projectId],
  );

  const closeTicketStats = useCallback(() => {
    setViewingTicketId(null);
    setTicketStats(null);
  }, []);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-400">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{tc("loading")}</span>
        </div>
      </div>
    );
  }

  const roleLabel = state.currentUser.role === "DEV" ? tp("roleDev") : state.currentUser.role === "QA" ? tp("roleQa") : state.currentUser.role;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:px-6 md:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/project/${projectId}`} className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("sessionTitle")}
            </h1>
          </div>

          <UserMenu
            userName={state.currentUser.name}
            isScrumMaster={isSM}
            roleBadge={state.currentUser.role ? (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[state.currentUser.role] ?? ""}`}>
                {roleLabel}
              </span>
            ) : undefined}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-80 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("tickets")}</h2>
            {isSM && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setShowImportModal(true)} title={t("importTickets")} className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </button>
                <button type="button" onClick={() => setShowTicketForm((v) => !v)} className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    {showTicketForm ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    )}
                  </svg>
                </button>
              </div>
            )}
          </div>

          {isSM && showTicketForm && (
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <TicketForm projectId={projectId} onSuccess={() => { setShowTicketForm(false); refresh(); }} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {state.tickets.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-zinc-400">
                {isSM ? (
                  <>{t("noTicketsSm")}<br />{t("noTicketsSm2")}{" "}<button type="button" onClick={() => setShowTicketForm(true)} className="text-blue-500 underline">+</button>{" "}{t("noTicketsSm3")}</>
                ) : (
                  t("noTicketsTeam")
                )}
              </p>
            ) : (
              state.tickets.map((ticket) => {
                const estimated = ticket.storyPoints != null;
                return (
                  <div
                    key={ticket.id}
                    onClick={estimated && !ticket.isActive ? () => openTicketStats(ticket.id) : undefined}
                    className={`group mb-1 rounded-lg border px-3 py-2.5 transition-colors ${
                      ticket.isActive
                        ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                        : estimated
                          ? "cursor-pointer border-emerald-100 bg-emerald-50/50 hover:border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:hover:border-emerald-800"
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
                          {ticket.externalId && <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{ticket.externalId}</span>}
                          <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{ticket.title}</p>
                          {estimated && <span className="mt-0.5 inline-flex rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">{ticket.storyPoints} SP</span>}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {ticket.isActive ? (
                          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">{t("active")}</span>
                        ) : isSM ? (
                          <>
                            <button type="button" onClick={() => act(() => setActiveTicket(projectId, ticket.id))} disabled={isPending} className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-all hover:bg-blue-700 group-hover:opacity-100 disabled:opacity-50 dark:bg-blue-500">
                              {estimated ? t("reestimate") : t("estimate")}
                            </button>
                            <button type="button" onClick={() => act(() => deleteTicket(projectId, ticket.id))} disabled={isPending} className="rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400">
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

        <main className="flex flex-1 flex-col overflow-hidden">
          {viewingTicketId && (
            <div className="flex border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <button type="button" onClick={closeTicketStats} className={`px-4 py-2.5 text-xs font-medium transition-colors ${!viewingTicketId ? "border-b-2 border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}>
                {t("session")}
              </button>
              <div className="flex items-center border-b-2 border-blue-600 dark:border-blue-400">
                <span className="px-4 py-2.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                  {statsLoading ? tc("loading") : ticketStats?.ticket.title ?? t("ticket")}
                </span>
                <button type="button" onClick={closeTicketStats} className="mr-1 rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl p-4 md:p-8">
              {!viewingTicketId && (
                <>
                  {state.status === "IDLE" && <IdleState isSM={isSM} hasTickets={state.tickets.length > 0} />}
                  {state.status === "VOTING" && state.activeTicket && (
                    <>
                      <TicketInfo ticket={state.activeTicket} />
                      {canVote && !state.votes.currentUserVoted && <div className={isSM ? "mb-6" : ""}><VotingForm projectId={projectId} onSuccess={refresh} /></div>}
                      {canVote && state.votes.currentUserVoted && !isSM && <WaitingForTeam votes={state.votes} />}
                      {isSM && <SMVotingPanel votes={state.votes} voterStatus={state.voterStatus} onReveal={() => act(() => revealVotes(projectId))} isPending={isPending} />}
                    </>
                  )}
                  {state.status === "REVEALED" && state.activeTicket && state.results && (
                    <>
                      <TicketInfo ticket={state.activeTicket} />
                      <VotingResults results={state.results} />
                      {state.individualVotes && state.individualVotes.length > 0 && <div className="mt-5"><VoteDetails votes={state.individualVotes} results={state.results} isSM={isSM} /></div>}
                      {isSM && <SpAcceptPanel recommendedSp={state.results.recommendedSp} selectedSp={selectedSp} onSelect={setSelectedSp} onAccept={(sp) => act(() => acceptEstimation(projectId, sp))} onRestart={() => act(() => restartVoting(projectId))} isPending={isPending} spScale={state.spScale} />}
                    </>
                  )}
                </>
              )}

              {viewingTicketId && (
                <>
                  {statsLoading && <p className="py-8 text-center text-sm text-zinc-400">{t("statsLoading")}</p>}
                  {!statsLoading && ticketStats && (
                    <div className="space-y-5">
                      <div>
                        {ticketStats.ticket.externalId && <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{ticketStats.ticket.externalId}</span>}
                        <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{ticketStats.ticket.title}</h2>
                        {ticketStats.ticket.storyPoints != null && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white dark:bg-blue-500">{ticketStats.ticket.storyPoints} SP</span>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t("currentEstimate")}</span>
                          </div>
                        )}
                      </div>
                      {ticketStats.results && (
                        <>
                          <VotingResults results={ticketStats.results} />
                          {ticketStats.individualVotes.length > 0 && <VoteDetails votes={ticketStats.individualVotes} results={ticketStats.results} isSM={isSM} />}
                        </>
                      )}
                      {!ticketStats.results && ticketStats.individualVotes.length === 0 && <p className="py-8 text-center text-sm text-zinc-400">{t("noVotes")}</p>}
                      {isSM && (
                        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                          {ticketStats.results && <SpAcceptPanel recommendedSp={ticketStats.results.recommendedSp} selectedSp={statsSp} onSelect={setStatsSp} onAccept={(sp) => { act(async () => { await acceptEstimation(projectId, sp); closeTicketStats(); }); }} onRestart={() => { act(async () => { await setActiveTicket(projectId, viewingTicketId); closeTicketStats(); }); }} isPending={isPending} spScale={state.spScale} />}
                          {!ticketStats.results && (
                            <button type="button" onClick={() => { act(async () => { await setActiveTicket(projectId, viewingTicketId); closeTicketStats(); }); }} disabled={isPending} className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600">
                              {t("estimate")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {showImportModal && <TicketImportModal projectId={projectId} onClose={() => setShowImportModal(false)} onSuccess={() => refresh()} />}
    </div>
  );
}

function IdleState({ isSM, hasTickets }: { isSM: boolean; hasTickets: boolean }) {
  const t = useTranslations("estimation");
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        {isSM ? t("selectTicketTitle") : t("waitingSmTitle")}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {isSM ? (hasTickets ? t("selectTicketDesc") : t("addTicketsDesc")) : t("waitingSmDesc")}
      </p>
    </div>
  );
}

function TicketInfo({ ticket }: { ticket: SessionTicket }) {
  const t = useTranslations("estimation");
  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2">
        {ticket.externalId &&
          (ticket.externalUrl ? (
            <a href={ticket.externalUrl} target="_blank" rel="noopener noreferrer" className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-blue-950/30">
              {ticket.externalId} ↗
            </a>
          ) : (
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{ticket.externalId}</span>
          ))}
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{ticket.title}</h2>
      {ticket.description && <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{ticket.description}</p>}
      {ticket.acceptanceCriteria && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="mb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">{t("acceptanceCriteria")}</p>
          <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{ticket.acceptanceCriteria}</p>
        </div>
      )}
    </div>
  );
}

function SMVotingPanel({ votes, voterStatus, onReveal, isPending }: { votes: VoteProgress; voterStatus: VoterStatus[] | null; onReveal: () => void; isPending: boolean }) {
  const t = useTranslations("estimation");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">{t("voting")}</h3>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">{t("progress")}</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{votes.submittedCount} / {votes.totalVoters}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${votes.totalVoters > 0 ? (votes.submittedCount / votes.totalVoters) * 100 : 0}%` }} />
          </div>
        </div>
      </div>
      {voterStatus && voterStatus.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {voterStatus.map((v) => (
            <span key={v.oderId} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${v.voted ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
              {v.voted ? (<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>) : (<span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-40" />)}
              {v.name}
            </span>
          ))}
        </div>
      )}
      {votes.totalVoters === 0 && <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">{t("noVoters")}</p>}
      <button type="button" onClick={onReveal} disabled={isPending || votes.submittedCount === 0} className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600">
        {isPending ? t("processing") : votes.submittedCount > 0 ? t("revealResultsCount", { count: votes.submittedCount }) : t("revealResults")}
      </button>
    </div>
  );
}

const DEFAULT_SP_OPTIONS = [1, 2, 3, 5, 8, 13];

function SpAcceptPanel({ recommendedSp, selectedSp, onSelect, onAccept, onRestart, isPending, spScale }: { recommendedSp: number; selectedSp: number | null; onSelect: (sp: number) => void; onAccept: (sp: number) => void; onRestart: () => void; isPending: boolean; spScale?: SpScaleOption[] }) {
  const t = useTranslations("estimation");
  const activeSp = selectedSp ?? recommendedSp;
  const options = spScale && spScale.length > 0 ? spScale : DEFAULT_SP_OPTIONS.map((v) => ({ value: v, label: "" }));

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">{t("storyPoints")}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => onSelect(opt.value)} disabled={isPending} className={`group/sp relative flex flex-col items-center justify-center rounded-lg px-3 py-2 text-sm font-bold transition-all disabled:opacity-50 ${activeSp === opt.value ? "bg-blue-600 text-white shadow-md dark:bg-blue-500" : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"}`}>
              <span>{opt.value}</span>
              {opt.label && <span className={`mt-0.5 text-[9px] font-normal leading-tight ${activeSp === opt.value ? "text-blue-200" : "text-zinc-400 dark:text-zinc-500"}`}>{opt.label}</span>}
              {opt.value === recommendedSp && activeSp !== opt.value && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-400" />}
            </button>
          ))}
        </div>
        {activeSp !== recommendedSp && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{t("recommendation", { sp: recommendedSp })}</p>}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => onAccept(activeSp)} disabled={isPending} className="flex-1 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600">
          {t("accept", { sp: activeSp })}
        </button>
        <button type="button" onClick={onRestart} disabled={isPending} className="rounded-xl border border-zinc-300 px-5 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          {t("revote")}
        </button>
      </div>
    </div>
  );
}

function WaitingForTeam({ votes }: { votes: VoteProgress }) {
  const t = useTranslations("estimation");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex justify-center">
        <svg className="h-10 w-10 animate-pulse text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{t("waitingTeamTitle")}</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("waitingTeamDesc")}</p>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-semibold">{votes.submittedCount}</span>
        <span>{t("of")}</span>
        <span className="font-semibold">{votes.totalVoters}</span>
        <span>{t("voted")}</span>
      </div>
    </div>
  );
}
