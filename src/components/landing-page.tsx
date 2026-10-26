"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageShell, Card, Badge } from "@/components/ui";
import { useInView } from "@/hooks/use-in-view";

// ─────────────────────────────────────────────────────────────────────────────
// Icons (inline SVG)
// ─────────────────────────────────────────────────────────────────────────────

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
    </svg>
  );
}
function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}
function RetroCycleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const t = useTranslations("landing");
  return (
    <PageShell variant="public" header={<LandingNav />}>
      <Hero t={t} />
      <MetricsSection t={t} />
      <ThreePillarsSection t={t} />
      <ClosedLoopSection t={t} />
      <HowItWorks t={t} />
      <FaqSection t={t} />
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sticky nav
// ─────────────────────────────────────────────────────────────────────────────

function LandingNav() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-zinc-900 transition-opacity hover:opacity-80 dark:text-zinc-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-violet-500 to-emerald-500 text-white shadow-md">
            <SparklesIcon className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">{tc("appName")}</span>
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Link
            href="/poker"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 sm:inline-flex md:px-3.5 md:py-2 dark:text-blue-300 dark:hover:bg-blue-950/40"
          >
            <BoltIcon className="h-3.5 w-3.5" />
            {tc("planningPokerNav")}
          </Link>
          <Link
            href="/retro"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 sm:inline-flex md:px-3.5 md:py-2 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
          >
            <RetroCycleIcon className="h-3.5 w-3.5" />
            {tc("sprintRetroNav")}
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 md:px-4 md:py-2 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("signIn")}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 md:px-4 md:py-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("signUp")}
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero — animated gradient + 3-module CTAs + interactive 3-tab ecosystem preview
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-12 md:pt-22 md:pb-16">
      {/* Layer 1 — soft mesh blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl animate-mesh-float-slow dark:bg-blue-700/20" />
        <div className="absolute right-[8%] top-28 h-64 w-64 rounded-full bg-emerald-300/25 blur-3xl animate-mesh-float dark:bg-emerald-700/20" />
        <div className="absolute left-1/2 top-44 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-200/25 blur-3xl dark:bg-violet-800/20" />
      </div>

      {/* Layer 2 — dot-grid pattern */}
      <div
        aria-hidden="true"
        className="dot-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px]"
      />

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-emerald-700 shadow-xs backdrop-blur-sm dark:border-emerald-800/60 dark:bg-zinc-900/70 dark:text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {t("badge")}
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tighter text-zinc-900 sm:text-6xl md:text-7xl dark:text-zinc-50">
          <span className="text-gradient-animated">{t("heroAccentWord")}</span>
          <br />
          {t("heroSecondLine")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-zinc-600 sm:text-lg md:text-xl dark:text-zinc-400">
          {t("subheadline")}
        </p>

        {/* Action CTAs for Quick Poker, Sprint Retro, and Full Workspace */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
          <Link
            href="/poker"
            className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 focus-visible:ring-4 focus-visible:ring-blue-500/30 focus:outline-none sm:w-auto sm:text-base"
          >
            <BoltIcon className="h-4 w-4" />
            {t("heroPrimaryCta")}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/retro"
            className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/90 px-6 py-3.5 text-sm font-semibold text-emerald-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-100 focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus:outline-none sm:w-auto sm:text-base dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 dark:hover:bg-emerald-950"
          >
            <RetroCycleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {t("heroRetroCta")}
          </Link>
          <Link
            href="/register"
            className="inline-flex w-full max-w-xs items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 px-5 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:w-auto sm:text-base dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("heroSecondaryCta")}
          </Link>
        </div>

        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          {t("heroBottomNote")}
        </p>
      </div>

      <EcosystemLivePreview t={t} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EcosystemLivePreview — Interactive 3-Tab Showcase (Poker | Gantt | Retro)
// ─────────────────────────────────────────────────────────────────────────────

type PreviewTab = "poker" | "gantt" | "retro";

type Bar = { v: string; h: string; median?: boolean; recommended?: boolean; outlier?: boolean };
type Snapshot = {
  round: string;
  bars: Bar[];
  median: string;
  recommended: string;
  voters: number;
};

const PREVIEW_SNAPSHOTS = (rounds: [string, string, string]): Snapshot[] => [
  {
    round: rounds[0],
    voters: 7,
    median: "5",
    recommended: "5 SP",
    bars: [
      { v: "1", h: "h-8" },
      { v: "2", h: "h-12" },
      { v: "3", h: "h-20", median: true },
      { v: "5", h: "h-28", median: true, recommended: true },
      { v: "8", h: "h-16" },
      { v: "13", h: "h-6" },
      { v: "21", h: "h-4", outlier: true },
    ],
  },
  {
    round: rounds[1],
    voters: 6,
    median: "8",
    recommended: "8 SP",
    bars: [
      { v: "1", h: "h-3" },
      { v: "2", h: "h-6" },
      { v: "3", h: "h-10" },
      { v: "5", h: "h-20", median: true },
      { v: "8", h: "h-28", median: true, recommended: true },
      { v: "13", h: "h-16" },
      { v: "21", h: "h-6" },
    ],
  },
  {
    round: rounds[2],
    voters: 9,
    median: "3",
    recommended: "3 SP",
    bars: [
      { v: "1", h: "h-12" },
      { v: "2", h: "h-20" },
      { v: "3", h: "h-28", median: true, recommended: true },
      { v: "5", h: "h-20", median: true },
      { v: "8", h: "h-8" },
      { v: "13", h: "h-4", outlier: true },
      { v: "21", h: "h-3" },
    ],
  },
];

function EcosystemLivePreview({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("poker");
  const [paused, setPaused] = useState(false);

  const snapshots = PREVIEW_SNAPSHOTS([
    t("previewRound1"),
    t("previewRound2"),
    t("previewRound3"),
  ]);
  const [pokerIdx, setPokerIdx] = useState(0);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setPokerIdx((i) => (i + 1) % snapshots.length);
    }, 5200);
    return () => clearInterval(id);
  }, [paused, snapshots.length]);

  const currentPoker = snapshots[pokerIdx];

  return (
    <div
      className="mx-auto mt-12 max-w-4xl px-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Interactive Tab Switcher */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("poker")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "poker"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 dark:bg-blue-500"
              : "border border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <BoltIcon className="h-4 w-4" />
          {t("previewTabPoker")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gantt")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "gantt"
              ? "bg-violet-600 text-white shadow-md shadow-violet-500/25 dark:bg-violet-500"
              : "border border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <ChartIcon className="h-4 w-4" />
          {t("previewTabGantt")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("retro")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "retro"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 dark:bg-emerald-500"
              : "border border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <RetroCycleIcon className="h-4 w-4" />
          {t("previewTabRetro")}
          <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200">
            NEW
          </span>
        </button>
      </div>

      {/* Main Window Frame */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-md md:p-7 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-blue-500/5">
        {activeTab === "poker" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                  <BoltIcon className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {t("previewLabelCode")}
                  </p>
                  <p className="font-mono text-sm font-bold tracking-wider text-zinc-900 dark:text-zinc-50">
                    XKZ-294
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 dark:bg-emerald-950/40">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  {t("previewLabelLive")}
                </span>
              </div>
            </div>

            {/* Round + voter counter row */}
            <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 pb-3 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {currentPoker.round}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="tabular-nums">
                  {t("previewVoters", { count: currentPoker.voters })}
                </span>
              </div>
            </div>

            {/* Bars */}
            <div className="flex items-end justify-around gap-1.5 px-2 pt-2 pb-2 sm:gap-3">
              {currentPoker.bars.map((bar, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={[
                      "w-full rounded-t-md transition-all animate-bar-rise",
                      bar.h,
                      bar.outlier
                        ? "bg-red-300 ring-2 ring-red-500 dark:bg-red-900/50 dark:ring-red-500"
                        : bar.recommended
                          ? "bg-gradient-to-t from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-400"
                          : bar.median
                            ? "bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-400 dark:to-blue-300"
                            : "bg-zinc-200 dark:bg-zinc-700",
                    ].join(" ")}
                    style={{ animationDelay: `${i * 70}ms` }}
                  />
                  <span
                    className={[
                      "text-[10px] font-semibold tabular-nums",
                      bar.median || bar.recommended
                        ? "text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-500 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    {bar.v}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3 text-[11px] dark:border-zinc-800">
              <span className="inline-flex items-center gap-1 text-zinc-500 tabular-nums dark:text-zinc-400">
                <span className="h-2 w-2 rounded-sm bg-blue-500" />
                {t("previewLegendMedian")}:{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {currentPoker.median}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-500 tabular-nums dark:text-zinc-400">
                <span className="h-2 w-2 rounded-sm bg-amber-500" />
                {t("previewLegendRecommended")}:{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {currentPoker.recommended}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                <span className="h-2 w-2 rounded-sm border-2 border-red-500 bg-red-300/60" />
                {t("previewLegendOutlier")}
              </span>
            </div>
          </div>
        )}

        {activeTab === "gantt" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                  <ChartIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                    Sprint 14 — Checkout & Retro Improvements
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t("previewGanttSub")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="role-dev" size="xs">DEV · 84%</Badge>
                <Badge tone="role-qa" size="xs">QA · 78%</Badge>
                <Badge tone="role-ba" size="xs">BA · 65%</Badge>
              </div>
            </div>

            {/* Simulated Gantt Rows */}
            <div className="space-y-2.5">
              {/* Row 1 */}
              <div className="grid grid-cols-12 items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="col-span-4 flex items-center gap-2">
                  <Badge tone="role-dev" size="xs">DEV</Badge>
                  <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Alex K.
                  </span>
                </div>
                <div className="col-span-8 flex items-center gap-1.5">
                  <div className="w-5/12 truncate rounded-md bg-indigo-500 px-2 py-1 text-[10px] font-semibold text-white">
                    CORE-142 OAuth2 (5 SP)
                  </div>
                  <div className="w-6/12 truncate rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white">
                    RETRO-08 CI Cache (3 SP)
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-12 items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="col-span-4 flex items-center gap-2">
                  <Badge tone="role-qa" size="xs">QA</Badge>
                  <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Maria S.
                  </span>
                </div>
                <div className="col-span-8 flex items-center gap-1.5">
                  <div className="w-3/12 truncate rounded-md border border-dashed border-amber-400 bg-amber-50 px-2 py-1 text-center text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {t("previewGanttVacation")}
                  </div>
                  <div className="w-5/12 truncate rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white">
                    QA: CORE-142 E2E
                  </div>
                  <div className="w-4/12 truncate rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white">
                    QA: RETRO-08
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-12 items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="col-span-4 flex items-center gap-2">
                  <Badge tone="role-ba" size="xs">BA</Badge>
                  <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Dmitry V.
                  </span>
                </div>
                <div className="col-span-8 flex items-center gap-1.5">
                  <div className="w-7/12 truncate rounded-md bg-amber-500 px-2 py-1 text-[10px] font-semibold text-white">
                    SPEC-89 Payment Webhooks Spec (5 SP)
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <span>{t("previewGanttFooterLeft")}</span>
              <span className="font-semibold text-violet-600 dark:text-violet-400">
                {t("previewGanttFooterRight")}
              </span>
            </div>
          </div>
        )}

        {activeTab === "retro" && (
          <div className="space-y-4">
            {/* Retro Header with Phase Stepper & Timer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <RetroCycleIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                    Sprint 14 Retrospective
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t("previewRetroPhaseStepper")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  04:12
                </span>
                <Badge tone="success" size="xs">
                  {t("previewRetroVotesLeft")}
                </Badge>
              </div>
            </div>

            {/* 3 Retro Columns */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Column 1: Went Well */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {t("previewRetroCol1")}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    2
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-zinc-900">
                    <p className="text-zinc-800 dark:text-zinc-200">
                      {t("previewRetroCard1")}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Alex K.</span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        +6
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: To Improve */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {t("previewRetroCol2")}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    2
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-zinc-900">
                    <p className="text-zinc-800 dark:text-zinc-200">
                      {t("previewRetroCard2")}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Maria S.</span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        +8
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Action Items -> Sprint Ticket */}
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                    {t("previewRetroCol3")}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                    1
                  </span>
                </div>
                <div className="rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-zinc-900">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {t("previewRetroAction1")}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <CheckIcon className="h-2.5 w-2.5" />
                      {t("previewRetroConvertedBadge")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MetricsSection — counters считаются при попадании в viewport
// ─────────────────────────────────────────────────────────────────────────────

function MetricsSection({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  const [ref, visible] = useInView<HTMLDivElement>();

  const items = [
    {
      target: 60,
      suffix: "s",
      label: t("metric1Label"),
      tone: "text-blue-600 dark:text-blue-400",
    },
    {
      target: 3,
      suffix: "",
      label: t("metric2Label"),
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      target: 6,
      suffix: "",
      label: t("metric3Label"),
      tone: "text-violet-600 dark:text-violet-400",
    },
    {
      target: 7,
      suffix: "",
      label: t("metric4Label"),
      tone: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <section
      ref={ref}
      className={`reveal-up ${visible ? "reveal-up--visible" : ""} border-y border-zinc-200 bg-white px-4 py-12 md:py-16 dark:border-zinc-800 dark:bg-zinc-900`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
          {items.map((m, i) => (
            <div key={i} className="text-center transition-transform hover:scale-105">
              <p
                className={`text-4xl font-bold tracking-tighter tabular-nums sm:text-5xl ${m.tone}`}
              >
                <Counter
                  to={m.target}
                  active={visible}
                  durationMs={1400}
                  delayMs={i * 120}
                />
                {m.suffix}
              </p>
              <p className="mt-1.5 text-xs leading-tight text-zinc-500 dark:text-zinc-400">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({
  to,
  active,
  durationMs = 1200,
  delayMs = 0,
}: {
  to: number;
  active: boolean;
  durationMs?: number;
  delayMs?: number;
}) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(to);
      return;
    }

    let rafId: number | null = null;
    let startTime: number | null = null;

    const timeoutId = setTimeout(() => {
      const tick = (now: number) => {
        if (startTime == null) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(to * eased));
        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setValue(to);
        }
      };
      rafId = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [active, to, durationMs, delayMs]);

  return <>{value}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ThreePillarsSection — Quick Poker + Sprint Retro + Sprint Planner (Gantt)
// ─────────────────────────────────────────────────────────────────────────────

function ThreePillarsSection({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  const [ref, visible] = useInView<HTMLElement>();
  return (
    <section
      ref={ref}
      className={`reveal-up ${visible ? "reveal-up--visible" : ""} px-4 py-20 md:py-28`}
    >
      <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
          {t("twoPathsTitle")}
        </h2>
        <p className="mt-3 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
          {t("twoPathsDesc")}
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3 md:gap-6">
        {/* Pillar 1: Planning Poker */}
        <Link
          href="/poker"
          className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
        >
          <Card
            variant="flush"
            className="relative h-full overflow-hidden border-2 border-blue-500/80 bg-gradient-to-br from-blue-50/90 via-white to-violet-50/60 p-7 transition-all group-hover:-translate-y-1 group-hover:border-blue-600 group-hover:shadow-2xl group-hover:shadow-blue-500/15 dark:border-blue-600/80 dark:from-blue-950/40 dark:via-zinc-900 dark:to-violet-950/30"
          >
            <Badge tone="info" size="sm" className="bg-blue-600 text-white dark:bg-blue-500 dark:text-white">
              {t("ctaQuickBadge")}
            </Badge>
            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md transition-transform group-hover:scale-110">
              <BoltIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("ctaQuickTitle")}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("ctaQuickDesc")}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {(["ctaQuickFeature1", "ctaQuickFeature2", "ctaQuickFeature3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm dark:bg-blue-500">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1 dark:text-blue-300">
              {t("ctaQuickAction")}
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </Card>
        </Link>

        {/* Pillar 2: Sprint Retro Board (NEW) */}
        <Link
          href="/retro"
          className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
        >
          <Card
            variant="flush"
            className="relative h-full overflow-hidden border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-7 transition-all group-hover:-translate-y-1 group-hover:border-emerald-600 group-hover:shadow-2xl group-hover:shadow-emerald-500/15 dark:border-emerald-600/80 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-teal-950/30"
          >
            <Badge tone="success" size="sm" className="bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white">
              {t("ctaRetroBadge")}
            </Badge>
            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md transition-transform group-hover:scale-110">
              <RetroCycleIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("ctaRetroTitle")}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("ctaRetroDesc")}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {(["ctaRetroFeature1", "ctaRetroFeature2", "ctaRetroFeature3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm dark:bg-emerald-500">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition-transform group-hover:translate-x-1 dark:text-emerald-300">
              {t("ctaRetroAction")}
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </Card>
        </Link>

        {/* Pillar 3: Sprint Planner & Gantt */}
        <Link
          href="/register"
          className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20 dark:focus-visible:ring-zinc-100/20"
        >
          <Card
            variant="flush"
            className="h-full border-2 border-zinc-200 p-7 transition-all group-hover:-translate-y-1 group-hover:border-zinc-400 group-hover:shadow-2xl dark:border-zinc-800 dark:group-hover:border-zinc-600"
          >
            <Badge tone="neutral" size="sm">
              {t("ctaFullBadge")}
            </Badge>
            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 text-white shadow-md transition-transform group-hover:scale-110 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
              <ChartIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("ctaFullTitle")}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("ctaFullDesc")}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {(["ctaFullFeature1", "ctaFullFeature2", "ctaFullFeature3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 transition-transform group-hover:translate-x-1 dark:text-zinc-100">
              {t("ctaFullAction")}
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </Card>
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ClosedLoopSection — 4-Step Closed-Loop Agile Workflow
// ─────────────────────────────────────────────────────────────────────────────

function ClosedLoopSection({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  const [ref, visible] = useInView<HTMLElement>();

  const steps = [
    {
      num: "01",
      title: t("loopStep1Title"),
      desc: t("loopStep1Desc"),
      color: "from-blue-500 to-blue-600",
      badge: "Planning Poker",
    },
    {
      num: "02",
      title: t("loopStep2Title"),
      desc: t("loopStep2Desc"),
      color: "from-violet-500 to-indigo-600",
      badge: "Sprint Gantt",
    },
    {
      num: "03",
      title: t("loopStep3Title"),
      desc: t("loopStep3Desc"),
      color: "from-emerald-500 to-teal-600",
      badge: "Sprint Retro",
    },
    {
      num: "04",
      title: t("loopStep4Title"),
      desc: t("loopStep4Desc"),
      color: "from-amber-500 to-orange-600",
      badge: "Action → Ticket",
    },
  ];

  return (
    <section
      ref={ref}
      className={`reveal-up ${visible ? "reveal-up--visible" : ""} border-t border-zinc-200 bg-zinc-50/70 px-4 py-20 md:py-24 dark:border-zinc-800 dark:bg-zinc-950`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <Badge tone="success" size="sm">
            {t("loopEyebrow")}
          </Badge>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            {t("loopTitle")}
          </h2>
          <p className="mt-3 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
            {t("loopSubtitle")}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-xs font-bold text-white shadow-sm`}
                  >
                    {s.num}
                  </span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {s.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How it works — 3 steps with bold numerals + scroll reveal
// ─────────────────────────────────────────────────────────────────────────────

function HowItWorks({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  const [ref, visible] = useInView<HTMLElement>();
  return (
    <section
      ref={ref}
      className={`reveal-up ${visible ? "reveal-up--visible" : ""} border-t border-zinc-200 bg-white px-4 py-20 md:py-24 dark:border-zinc-800 dark:bg-zinc-900`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            {t("howQuickTitle")}
          </h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {t("howQuickSub")}
          </p>
        </div>
        <ol className="grid gap-6 md:grid-cols-3 md:gap-8">
          {[1, 2, 3].map((n) => (
            <li key={n} className="group relative">
              <div className="pointer-events-none absolute -left-2 -top-2 select-none text-7xl font-bold text-zinc-100 transition-all group-hover:text-blue-100 dark:text-zinc-800 dark:group-hover:text-blue-950/40">
                {n}
              </div>
              <div className="relative pl-10 pt-4">
                <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md">
                  {n}
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {t(`howQuick${n}Title` as "howQuick1Title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t(`howQuick${n}Desc` as "howQuick1Desc")}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/poker"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 focus-visible:ring-4 focus-visible:ring-blue-500/30 focus:outline-none"
          >
            <BoltIcon className="h-4 w-4" />
            {t("heroPrimaryCta")}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/retro"
            className="group inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-3.5 text-sm font-semibold text-emerald-800 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
          >
            <RetroCycleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {t("heroRetroCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ — native <details> accordion + bottom callout
// ─────────────────────────────────────────────────────────────────────────────

function FaqSection({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  const [ref, visible] = useInView<HTMLElement>();
  return (
    <section
      ref={ref}
      className={`reveal-up ${visible ? "reveal-up--visible" : ""} px-4 py-20`}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md">
            <LockIcon className="h-4 w-4" />
          </span>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            {t("faqTitle")}
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <details
              key={i}
              className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors open:border-blue-300 open:shadow-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:open:border-blue-700 dark:hover:border-zinc-700"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="text-sm md:text-base">
                  {t(`faq${i}Q` as "faq1Q")}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-transform duration-300 group-open:rotate-45 group-open:bg-blue-100 group-open:text-blue-600 dark:bg-zinc-800 dark:text-zinc-400 dark:group-open:bg-blue-950/40 dark:group-open:text-blue-300"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(`faq${i}A` as "faq1A")}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100/50 p-7 text-center md:p-9 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-emerald-500 text-white shadow-md">
            <ClockIcon className="h-5 w-5" />
          </span>
          <p className="text-balance text-xl font-bold tracking-tight text-zinc-900 md:text-2xl dark:text-zinc-50">
            {t("finalCalloutTitle")}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("finalCalloutDesc")}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/poker"
              className="group inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-zinc-900/20 focus:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:ring-zinc-100/20"
            >
              <BoltIcon className="h-4 w-4" />
              {t("heroPrimaryCta")}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/retro"
              className="group inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
            >
              <RetroCycleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {t("heroRetroCta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
