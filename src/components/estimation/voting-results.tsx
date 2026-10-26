"use client";

import { useTranslations } from "next-intl";
import type { EstimationResults } from "@/hooks/use-estimation-polling";

const CRITERIA_META = [
  {
    key: "avgDevEffort" as const,
    meanKey: "meanDevEffort" as const,
    label: "Dev Effort",
    color: "bg-indigo-500",
    max: 6,
  },
  {
    key: "avgQaEffort" as const,
    meanKey: "meanQaEffort" as const,
    label: "QA Effort",
    color: "bg-emerald-500",
    max: 4,
  },
  {
    key: "avgRisk" as const,
    meanKey: "meanRisk" as const,
    label: "Risk",
    color: "bg-amber-500",
    max: 2,
  },
  {
    key: "avgUncertainty" as const,
    meanKey: "meanUncertainty" as const,
    label: "Uncertainty",
    color: "bg-violet-500",
    max: 2,
  },
];

function CriterionBar({
  label,
  value,
  meanValue,
  medianLabel,
  averageLabel,
  max,
  color,
}: {
  label: string;
  value: number;
  meanValue: number;
  medianLabel: string;
  averageLabel: string;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            {medianLabel}:{" "}
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              {value}
            </strong>
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {averageLabel}:{" "}
            <strong className="font-semibold text-indigo-600 dark:text-indigo-400">
              {meanValue}
            </strong>
          </span>
        </div>
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

export function VotingResults({
  results,
  workingHoursPerDay = 8,
}: {
  results: EstimationResults;
  workingHoursPerDay?: number;
}) {
  if (results.method === "COMPOSITE_SP") {
    return <CompositeResults results={results} />;
  }
  return <SimpleResults results={results} workingHoursPerDay={workingHoursPerDay} />;
}

// =====================================================================
// COMPOSITE_SP
// =====================================================================

function CompositeResults({
  results,
}: {
  results: Extract<EstimationResults, { method: "COMPOSITE_SP" }>;
}) {
  const t = useTranslations("votingResults");
  const devPct = Math.round(results.devProportion * 100);
  const qaPct = 100 - devPct;

  const voteCountLabel = t("votesCount", { count: results.voteCount });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            {t("recommendation")}
          </h3>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{voteCountLabel}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Медианная оценка */}
          <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500">
              <span className="text-2xl font-bold text-white">{results.recommendedSp}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                {t("medianEstimate")}
              </span>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {results.recommendedSp} SP
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t("totalScore", { score: results.totalScore })}
              </p>
            </div>
          </div>

          {/* Средняя оценка */}
          <div className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 dark:bg-indigo-500">
              <span className="text-2xl font-bold text-white">{results.averageSp}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                {t("averageEstimate")}
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {results.averageSp} SP
                </p>
                {results.exactAverageSp !== results.averageSp && (
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    ({results.exactAverageSp} SP)
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t("averageScore", { score: results.meanTotalScore })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          {t("devQaProportion")}
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
          {t("medianScores")}
        </h3>

        <div className="space-y-3">
          {CRITERIA_META.map((c) => (
            <CriterionBar
              key={c.key}
              label={c.label}
              value={results[c.key]}
              meanValue={results[c.meanKey]}
              medianLabel={t("median")}
              averageLabel={t("average")}
              max={c.max}
              color={c.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// FIBONACCI_SP / HOURS / DAYS
// =====================================================================

function formatValue(value: number, method: "FIBONACCI_SP" | "HOURS" | "DAYS"): string {
  if (method === "HOURS") return `${value}h`;
  if (method === "DAYS") return `${value}d`;
  return `${value} SP`;
}

function SimpleResults({
  results,
  workingHoursPerDay,
}: {
  results: Extract<EstimationResults, { method: "FIBONACCI_SP" | "HOURS" | "DAYS" }>;
  workingHoursPerDay: number;
}) {
  const t = useTranslations("votingResults");
  const voteCountLabel = t("votesCount", { count: results.voteCount });
  const rounded = formatValue(results.roundedValue, results.method);
  const median = formatValue(results.medianValue, results.method);
  const averageRounded = formatValue(results.averageRoundedValue, results.method);
  const average = formatValue(results.averageValue, results.method);

  const recommendationHint =
    results.method === "HOURS"
      ? t("hoursDaysHint", {
          days: Math.max(
            1,
            Math.ceil(results.roundedValue / Math.max(1, workingHoursPerDay)),
          ),
        })
      : results.method === "DAYS"
        ? t("daysHint")
        : t("fibonacciHint");

  const averageHint =
    results.method === "HOURS"
      ? t("hoursDaysHint", {
          days: Math.max(
            1,
            Math.ceil(results.averageRoundedValue / Math.max(1, workingHoursPerDay)),
          ),
        })
      : results.method === "DAYS"
        ? t("daysHint")
        : t("averageFibonacciHint");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            {t("recommendation")}
          </h3>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{voteCountLabel}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Медианная оценка */}
          <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500">
              <span className="text-xl font-bold text-white">{rounded}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                {t("medianEstimate")}
              </span>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {t("medianValue", { value: median })}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{recommendationHint}</p>
            </div>
          </div>

          {/* Средняя оценка */}
          <div className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 dark:bg-indigo-500">
              <span className="text-xl font-bold text-white">{averageRounded}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                {t("averageEstimate")}
              </span>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {t("averageValue", { value: average })}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{averageHint}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          {t("voteSpread")}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("min")}</p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatValue(results.minValue, results.method)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("median")}</p>
            <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">
              {median}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("average")}</p>
            <p className="mt-1 text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {average}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("max")}</p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatValue(results.maxValue, results.method)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
