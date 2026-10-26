"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type {
  IndividualVote,
  EstimationResults,
  EstimationConfig,
} from "@/hooks/use-estimation-polling";
import { setShowDistribution } from "@/app/actions/estimation";
import { VoteDistributionChart } from "./vote-distribution-chart";

function detectOutlierBounds(scores: number[]): { lower: number; upper: number } {
  if (scores.length < 4) return { lower: -Infinity, upper: Infinity };
  const sorted = [...scores].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr };
}

function Pill({
  value,
  highlight,
}: {
  value: number | string;
  highlight?: "risk" | "outlier";
}) {
  let cls =
    "inline-flex h-6 min-w-[2rem] items-center justify-center rounded px-1.5 text-xs font-semibold ";
  if (highlight === "risk") {
    cls += "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  } else {
    cls += "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
  return <span className={cls}>{value}</span>;
}

interface Props {
  votes: IndividualVote[];
  results: EstimationResults;
  isSM: boolean;
  /** Конфиг эстимации — shape, unit, showDistributionToAll. */
  estimationConfig?: EstimationConfig;
  /** Для отправки `setShowDistribution` действия (нужен только если isSM). */
  projectId?: string;
  /** Колбэк после успешного тоггла — обычно `refresh` из useEstimationPolling. */
  onRefresh?: () => void;
}

export function VoteDetails({
  votes,
  results,
  isSM,
  estimationConfig,
  projectId,
  onRefresh,
}: Props) {
  const t = useTranslations("voteDetails");

  const showDistributionToAll = estimationConfig?.showDistributionToAll ?? false;
  // Кому показывается chart: SM/host всегда; остальным — только если SM включил
  const chartVisible = isSM || showDistributionToAll;
  // Чекбокс показывается только SM
  const showToggle = isSM && projectId;

  if (results.method === "COMPOSITE_SP") {
    return (
      <CompositeView
        votes={votes}
        results={results}
        isSM={isSM}
        chartVisible={chartVisible}
        showToggle={!!showToggle}
        showDistributionToAll={showDistributionToAll}
        projectId={projectId}
        onRefresh={onRefresh}
        t={t}
      />
    );
  }
  return (
    <SimpleView
      votes={votes}
      results={results}
      isSM={isSM}
      estimationConfig={estimationConfig}
      chartVisible={chartVisible}
      showToggle={!!showToggle}
      showDistributionToAll={showDistributionToAll}
      projectId={projectId}
      onRefresh={onRefresh}
      t={t}
    />
  );
}

// =====================================================================
// Чекбокс «Показывать график всем»
// =====================================================================

function ShowDistributionToggle({
  projectId,
  checked,
  onRefresh,
  t,
}: {
  projectId: string;
  checked: boolean;
  onRefresh?: () => void;
  t: TFunction;
}) {
  const [optimistic, setOptimistic] = useState(checked);
  const [isPending, startTransition] = useTransition();

  // Если props.checked изменился из polling — синхронизируемся
  if (optimistic !== checked && !isPending) {
    setOptimistic(checked);
  }

  const handleChange = (next: boolean) => {
    setOptimistic(next);
    startTransition(async () => {
      await setShowDistribution(projectId, next);
      onRefresh?.();
    });
  };

  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 select-none text-xs ${isPending ? "opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        checked={optimistic}
        onChange={(e) => handleChange(e.target.checked)}
        disabled={isPending}
        className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
      />
      <span className="text-zinc-600 dark:text-zinc-400">{t("showToAll")}</span>
    </label>
  );
}

type TFunction = ReturnType<typeof useTranslations<"voteDetails">>;

// =====================================================================
// COMPOSITE view (chart по totalScore + 4-факторная таблица)
// =====================================================================

function CompositeView({
  votes,
  results,
  isSM,
  chartVisible,
  showToggle,
  showDistributionToAll,
  projectId,
  onRefresh,
  t,
}: {
  votes: IndividualVote[];
  results: Extract<EstimationResults, { method: "COMPOSITE_SP" }>;
  isSM: boolean;
  chartVisible: boolean;
  showToggle: boolean;
  showDistributionToAll: boolean;
  projectId?: string;
  onRefresh?: () => void;
  t: TFunction;
}) {
  const chartVotes = votes.map((v) => ({
    value: v.totalScore,
    name: v.name,
  }));
  const scores = votes.map((v) => v.totalScore);
  const bounds = isSM ? detectOutlierBounds(scores) : null;

  return (
    <div className="space-y-4">
      {chartVisible && chartVotes.length >= 3 && (
        <VoteDistributionChart
          votes={chartVotes}
          median={results.totalScore}
          average={results.meanTotalScore}
          unit=""
          headerSlot={
            showToggle && projectId ? (
              <ShowDistributionToggle
                projectId={projectId}
                checked={showDistributionToAll}
                onRefresh={onRefresh}
                t={t}
              />
            ) : undefined
          }
        />
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          {t("teamVotes")}
        </h3>

        <div className="overflow-x-auto">
          <CompositeTable
            votes={votes}
            bounds={bounds}
            medianTotal={results.totalScore}
            isSM={isSM}
            results={results}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// SIMPLE view (chart по singleValue + одноколоночная таблица)
// =====================================================================

function SimpleView({
  votes,
  results,
  isSM,
  estimationConfig,
  chartVisible,
  showToggle,
  showDistributionToAll,
  projectId,
  onRefresh,
  t,
}: {
  votes: IndividualVote[];
  results: Extract<EstimationResults, { method: "FIBONACCI_SP" | "HOURS" | "DAYS" }>;
  isSM: boolean;
  estimationConfig?: EstimationConfig;
  chartVisible: boolean;
  showToggle: boolean;
  showDistributionToAll: boolean;
  projectId?: string;
  onRefresh?: () => void;
  t: TFunction;
}) {
  const unit =
    results.method === "HOURS" ? "h" : results.method === "DAYS" ? "d" : "";
  const chartVotes = votes
    .map((v) => ({
      value: v.singleValue != null ? v.singleValue : NaN,
      name: v.name,
    }))
    .filter((v) => Number.isFinite(v.value));

  const scores = votes.map((v) => v.singleValue ?? 0);
  const bounds = isSM ? detectOutlierBounds(scores) : null;

  return (
    <div className="space-y-4">
      {chartVisible && chartVotes.length >= 3 && (
        <VoteDistributionChart
          votes={chartVotes}
          shape={estimationConfig?.shape}
          median={results.medianValue}
          average={results.averageValue}
          recommended={results.roundedValue}
          unit={unit}
          headerSlot={
            showToggle && projectId ? (
              <ShowDistributionToggle
                projectId={projectId}
                checked={showDistributionToAll}
                onRefresh={onRefresh}
                t={t}
              />
            ) : undefined
          }
        />
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          {t("teamVotes")}
        </h3>

        <div className="overflow-x-auto">
          <SimpleTable
            votes={votes}
            bounds={bounds}
            median={results.medianValue}
            average={results.averageValue}
            isSM={isSM}
            unit={unit}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// COMPOSITE-таблица
// =====================================================================

const COMPOSITE_COLUMNS = [
  { key: "devEffort" as const, label: "Dev" },
  { key: "qaEffort" as const, label: "QA" },
  { key: "risk" as const, label: "Risk" },
  { key: "uncertainty" as const, label: "Unc" },
  { key: "totalScore" as const, label: "Σ" },
];

function CompositeTable({
  votes,
  bounds,
  medianTotal,
  isSM,
  results,
}: {
  votes: IndividualVote[];
  bounds: { lower: number; upper: number } | null;
  medianTotal: number;
  isSM: boolean;
  results: Extract<EstimationResults, { method: "COMPOSITE_SP" }>;
}) {
  const t = useTranslations("voteDetails");
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-700">
          <th className="pb-2 pr-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t("participant")}
          </th>
          {COMPOSITE_COLUMNS.map((c) => (
            <th
              key={c.key}
              className="pb-2 px-1.5 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {votes.map((vote) => {
          const isOutlier =
            isSM &&
            bounds &&
            (vote.totalScore < bounds.lower || vote.totalScore > bounds.upper);
          const diff =
            medianTotal > 0
              ? Math.round(((vote.totalScore - medianTotal) / medianTotal) * 100)
              : 0;
          return (
            <tr
              key={vote.oderId}
              className={`group border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
                isOutlier ? "border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20" : ""
              }`}
              title={
                isOutlier
                  ? t("outlierTooltip", {
                      value: vote.totalScore,
                      median: medianTotal,
                      diff: `${diff > 0 ? "+" : ""}${diff}`,
                    })
                  : undefined
              }
            >
              <td className="py-2 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {vote.name}
                  </span>
                  {isOutlier && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                      {t("outlier")}
                    </span>
                  )}
                </div>
              </td>
              {COMPOSITE_COLUMNS.map((c) => (
                <td key={c.key} className="py-2 px-1.5 text-center">
                  <Pill
                    value={vote[c.key] ?? 0}
                    highlight={
                      isSM && c.key === "risk" && vote.risk === 2 ? "risk" : undefined
                    }
                  />
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
          <td className="py-2 pr-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {t("median")}
          </td>
          {COMPOSITE_COLUMNS.map((c) => {
            const medianMap: Record<string, number> = {
              devEffort: results.avgDevEffort,
              qaEffort: results.avgQaEffort,
              risk: results.avgRisk,
              uncertainty: results.avgUncertainty,
              totalScore: results.totalScore,
            };
            return (
              <td key={c.key} className="py-2 px-1.5 text-center">
                <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded bg-blue-100 px-1.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {medianMap[c.key]}
                </span>
              </td>
            );
          })}
        </tr>
        <tr className="border-t border-zinc-100 dark:border-zinc-800">
          <td className="py-2 pr-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {t("average")}
          </td>
          {COMPOSITE_COLUMNS.map((c) => {
            const meanMap: Record<string, number> = {
              devEffort: results.meanDevEffort,
              qaEffort: results.meanQaEffort,
              risk: results.meanRisk,
              uncertainty: results.meanUncertainty,
              totalScore: results.meanTotalScore,
            };
            return (
              <td key={c.key} className="py-2 px-1.5 text-center">
                <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded bg-indigo-100 px-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {meanMap[c.key]}
                </span>
              </td>
            );
          })}
        </tr>
      </tfoot>
    </table>
  );
}

// =====================================================================
// SIMPLE-таблица (одна колонка значения)
// =====================================================================

function SimpleTable({
  votes,
  bounds,
  median,
  average,
  isSM,
  unit,
}: {
  votes: IndividualVote[];
  bounds: { lower: number; upper: number } | null;
  median: number;
  average: number;
  isSM: boolean;
  unit: string;
}) {
  const t = useTranslations("voteDetails");
  const fmt = (v: number) => `${v}${unit}`;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-700">
          <th className="pb-2 pr-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t("participant")}
          </th>
          <th className="pb-2 px-1.5 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t("vote")}
          </th>
        </tr>
      </thead>
      <tbody>
        {votes.map((vote) => {
          const value = vote.singleValue ?? 0;
          const isOutlier =
            isSM && bounds && (value < bounds.lower || value > bounds.upper);
          const diff =
            median > 0 ? Math.round(((value - median) / median) * 100) : 0;
          return (
            <tr
              key={vote.oderId}
              className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
                isOutlier ? "border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20" : ""
              }`}
              title={
                isOutlier
                  ? t("outlierTooltip", {
                      value: fmt(value),
                      median: fmt(median),
                      diff: `${diff > 0 ? "+" : ""}${diff}`,
                    })
                  : undefined
              }
            >
              <td className="py-2 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {vote.name}
                  </span>
                  {isOutlier && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                      {t("outlier")}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2 px-1.5 text-right">
                <Pill value={fmt(value)} />
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
          <td className="py-2 pr-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {t("median")}
          </td>
          <td className="py-2 px-1.5 text-right">
            <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded bg-blue-100 px-1.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {fmt(median)}
            </span>
          </td>
        </tr>
        <tr className="border-t border-zinc-100 dark:border-zinc-800">
          <td className="py-2 pr-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {t("average")}
          </td>
          <td className="py-2 px-1.5 text-right">
            <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded bg-indigo-100 px-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {fmt(average)}
            </span>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
