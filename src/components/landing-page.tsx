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
      <DualCta t={t} />
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
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-500 text-white shadow-md">
            <SparklesIcon className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">{tc("appName")}</span>
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Link
            href="/poker"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 sm:inline-flex md:px-4 md:py-2 dark:text-blue-300 dark:hover:bg-blue-950/40"
          >
            <BoltIcon className="h-3.5 w-3.5" />
            {tc("planningPokerNav")}
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
// Hero — animated gradient + pulse CTA + dot-grid backdrop + floating blobs
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-8 md:pt-24 md:pb-12">
      {/* Layer 1 — soft mesh blobs (floating) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl animate-mesh-float-slow dark:bg-blue-700/20" />
        <div className="absolute right-[8%] top-32 h-64 w-64 rounded-full bg-violet-300/25 blur-3xl animate-mesh-float dark:bg-violet-700/20" />
        <div className="absolute left-1/2 top-44 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-200/25 blur-3xl dark:bg-cyan-800/20" />
      </div>

      {/* Layer 2 — dot-grid pattern (subtle texture) */}
      <div
        aria-hidden="true"
        className="dot-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px]"
      />

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-emerald-700 backdrop-blur-sm dark:border-emerald-800/60 dark:bg-zinc-950/40 dark:text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {t("badge")}
        </div>

        <h1 className="text-balance text-5xl font-bold tracking-tighter text-zinc-900 sm:text-6xl md:text-7xl lg:text-[5.5rem] dark:text-zinc-50">
          <span className="text-gradient-animated">{t("heroAccentWord")}</span>
          <br />
          {t("heroSecondLine")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-zinc-500 sm:text-lg md:text-xl dark:text-zinc-400">
          {t("subheadline")}
        </p>

        {/* Dual CTA — primary pulses, secondary ghost */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/poker"
            className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 animate-pulse-glow transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 focus-visible:ring-4 focus-visible:ring-blue-500/30 focus:outline-none sm:w-auto"
          >
            <BoltIcon className="h-4 w-4" />
            {t("heroPrimaryCta")}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/register"
            className="inline-flex w-full max-w-xs items-center justify-center gap-1.5 rounded-xl px-6 py-3.5 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:w-auto dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("heroSecondaryCta")}
          </Link>
        </div>

        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          {t("heroBottomNote")}
        </p>
      </div>

      <LivePreview t={t} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LivePreview — cycle через 3 «snapshot»-а Quick Poker (демо живёт само)
// ─────────────────────────────────────────────────────────────────────────────

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

function LivePreview({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  const snapshots = PREVIEW_SNAPSHOTS([
    t("previewRound1"),
    t("previewRound2"),
    t("previewRound3"),
  ]);

  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  // Cycle через 3 snapshot-а каждые ~5 секунд. Создаёт ощущение
  // что preview — настоящая live комната.
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % snapshots.length);
      setAnimKey((k) => k + 1);
    }, 5200);
    return () => clearInterval(id);
  }, [snapshots.length]);

  const current = snapshots[index];

  return (
    <div className="mx-auto mt-14 max-w-2xl px-2">
      <div className="relative rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-sm md:p-7 dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-blue-500/5">
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
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {current.round}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            <span className="tabular-nums">
              {t("previewVoters", { count: current.voters })}
            </span>
          </div>
        </div>

        {/* Bars — re-mount on snapshot change for fresh rise animation */}
        <div
          key={animKey}
          className="flex items-end justify-around gap-1.5 px-2 pb-2 sm:gap-3"
        >
          {current.bars.map((bar, i) => (
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

        {/* Legend with live median/recommended */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3 text-[10px] dark:border-zinc-800">
          <span className="inline-flex items-center gap-1 text-zinc-500 tabular-nums dark:text-zinc-400">
            <span className="h-2 w-2 rounded-sm bg-blue-500" />
            {t("previewLegendMedian")}: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{current.median}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-zinc-500 tabular-nums dark:text-zinc-400">
            <span className="h-2 w-2 rounded-sm bg-amber-500" />
            {t("previewLegendRecommended")}: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{current.recommended}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-sm border-2 border-red-500 bg-red-300/60" />
            {t("previewLegendOutlier")}
          </span>
        </div>

        {/* Progress dots — текущий snapshot */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {snapshots.map((_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 rounded-full transition-all",
                i === index
                  ? "w-6 bg-blue-500"
                  : "w-1.5 bg-zinc-300 dark:bg-zinc-700",
              ].join(" ")}
            />
          ))}
        </div>
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
      target: 0,
      suffix: "",
      label: t("metric2Label"),
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      target: 24,
      suffix: "h",
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

/**
 * Counter — анимированно считает от 0 до `to`, когда `active=true`.
 * Использует requestAnimationFrame, выполняется один раз.
 */
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

    // Уважаем prefers-reduced-motion
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
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
        // easeOutCubic
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
// Two paths — Quick Poker vs Sprint Planner
// ─────────────────────────────────────────────────────────────────────────────

function DualCta({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
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
      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2 md:gap-6">
        <Link
          href="/poker"
          className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
        >
          <Card
            variant="flush"
            className="relative h-full overflow-hidden border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-blue-100/60 to-violet-100/50 p-7 transition-all group-hover:-translate-y-1 group-hover:border-blue-600 group-hover:shadow-2xl group-hover:shadow-blue-500/20 md:p-8 dark:border-blue-600 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-violet-950/30 dark:group-hover:border-blue-500"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:bg-blue-400/40 dark:bg-blue-700/30"
            />
            <Badge tone="info" size="sm" className="relative bg-blue-600 text-white dark:bg-blue-500 dark:text-white">
              {t("ctaQuickBadge")}
            </Badge>
            <div className="relative mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3">
              <BoltIcon className="h-6 w-6" />
            </div>
            <h2 className="relative mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("ctaQuickTitle")}
            </h2>
            <p className="relative mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("ctaQuickDesc")}
            </p>
            <ul className="relative mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {(["ctaQuickFeature1", "ctaQuickFeature2", "ctaQuickFeature3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm dark:bg-blue-500">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <div className="relative mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1 dark:text-blue-300">
              {t("ctaQuickAction")}
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </Card>
        </Link>

        <Link
          href="/register"
          className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20 dark:focus-visible:ring-zinc-100/20"
        >
          <Card
            variant="flush"
            className="h-full border-2 border-zinc-200 p-7 transition-all group-hover:-translate-y-1 group-hover:border-zinc-400 group-hover:shadow-2xl md:p-8 dark:border-zinc-800 dark:group-hover:border-zinc-600"
          >
            <Badge tone="neutral" size="sm">
              {t("ctaFullBadge")}
            </Badge>
            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 text-white shadow-md transition-transform group-hover:scale-110 group-hover:-rotate-3 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
              <ChartIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("ctaFullTitle")}
            </h2>
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
        <div className="mt-14 text-center">
          <Link
            href="/poker"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 focus-visible:ring-4 focus-visible:ring-blue-500/30 focus:outline-none"
          >
            <BoltIcon className="h-4 w-4" />
            {t("heroPrimaryCta")}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-500 text-white shadow-md">
            <ClockIcon className="h-5 w-5" />
          </span>
          <p className="text-balance text-xl font-bold tracking-tight text-zinc-900 md:text-2xl dark:text-zinc-50">
            {t("finalCalloutTitle")}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("finalCalloutDesc")}
          </p>
          <Link
            href="/poker"
            className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-zinc-900/20 focus:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:ring-zinc-100/20"
          >
            <BoltIcon className="h-4 w-4" />
            {t("heroPrimaryCta")}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
