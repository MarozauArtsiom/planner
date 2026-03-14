"use client";

import type { EstimationResults } from "@/hooks/use-estimation-polling";

const SP_LABELS: Record<number, string> = {
  1: "1-2 дня",
  2: "Полспринта",
  3: "~1 неделя",
  5: "Крупная задача",
};

const CRITERIA_META = [
  { key: "avgDevEffort" as const, label: "Dev Effort", color: "bg-indigo-500" },
  {
    key: "avgQaEffort" as const,
    label: "QA Effort",
    color: "bg-emerald-500",
  },
  { key: "avgRisk" as const, label: "Risk", color: "bg-amber-500" },
  {
    key: "avgUncertainty" as const,
    label: "Uncertainty",
    color: "bg-violet-500",
  },
];

function CriterionBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function VotingResults({ results }: { results: EstimationResults }) {
  const devPct = Math.round(results.devProportion * 100);
  const qaPct = 100 - devPct;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Рекомендация
          </h3>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {results.voteCount}{" "}
            {results.voteCount === 1 ? "голос" : results.voteCount < 5 ? "голоса" : "голосов"}
          </span>
        </div>

        <div className="flex items-end gap-4">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500">
            <span className="text-3xl font-bold text-white">
              {results.recommendedSp}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {results.recommendedSp} SP
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {SP_LABELS[results.recommendedSp] ?? `${results.recommendedSp}+ SP`}
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Общий балл: {results.totalScore}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          Пропорция Dev / QA
        </h3>

        <div className="mb-2 flex h-5 overflow-hidden rounded-full">
          <div
            className="flex items-center justify-center bg-indigo-500 text-[10px] font-bold text-white transition-all"
            style={{ width: `${devPct}%` }}
          >
            {devPct > 15 && `${devPct}%`}
          </div>
          <div
            className="flex items-center justify-center bg-emerald-500 text-[10px] font-bold text-white transition-all"
            style={{ width: `${qaPct}%` }}
          >
            {qaPct > 15 && `${qaPct}%`}
          </div>
        </div>

        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
            Dev {devPct}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            QA {qaPct}%
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          Средние баллы
        </h3>

        <div className="space-y-3">
          {CRITERIA_META.map((c) => (
            <CriterionBar
              key={c.key}
              label={c.label}
              value={results[c.key]}
              max={c.key === "avgDevEffort" ? 6 : c.key === "avgQaEffort" ? 4 : 2}
              color={c.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
