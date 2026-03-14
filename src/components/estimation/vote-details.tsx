"use client";

import type { IndividualVote, EstimationResults } from "@/hooks/use-estimation-polling";

function detectOutlierBounds(scores: number[]): { lower: number; upper: number } {
  if (scores.length < 3) return { lower: -Infinity, upper: Infinity };
  const sorted = [...scores].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr };
}

function Pill({ value, highlight }: { value: number; highlight?: "risk" | "outlier" }) {
  let cls = "inline-flex h-6 w-8 items-center justify-center rounded text-xs font-semibold ";
  if (highlight === "risk") {
    cls += "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  } else {
    cls += "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
  return <span className={cls}>{value}</span>;
}

const COLUMNS = [
  { key: "devEffort" as const, label: "Dev" },
  { key: "qaEffort" as const, label: "QA" },
  { key: "risk" as const, label: "Risk" },
  { key: "uncertainty" as const, label: "Unc" },
  { key: "totalScore" as const, label: "Σ" },
];

interface Props {
  votes: IndividualVote[];
  results: EstimationResults;
  isSM: boolean;
}

export function VoteDetails({ votes, results, isSM }: Props) {
  const scores = votes.map((v) => v.totalScore);
  const bounds = isSM ? detectOutlierBounds(scores) : null;
  const medianTotal = results.totalScore;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
        Голоса команды
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="pb-2 pr-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Участник
              </th>
              {COLUMNS.map((c) => (
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
              const diff = medianTotal > 0
                ? Math.round(((vote.totalScore - medianTotal) / medianTotal) * 100)
                : 0;

              return (
                <tr
                  key={vote.oderId}
                  className={`group border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
                    isOutlier
                      ? "border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20"
                      : ""
                  }`}
                  title={
                    isOutlier
                      ? `Оценка сильно отличается от команды: ${vote.totalScore} vs медиана ${medianTotal} (${diff > 0 ? "+" : ""}${diff}%)`
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
                          Выброс
                        </span>
                      )}
                    </div>
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="py-2 px-1.5 text-center">
                      <Pill
                        value={vote[c.key]}
                        highlight={
                          isSM && c.key === "risk" && vote.risk === 2
                            ? "risk"
                            : undefined
                        }
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          {isSM && (
            <tfoot>
              <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                <td className="py-2 pr-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  Медиана
                </td>
                {COLUMNS.map((c) => {
                  const medianMap: Record<string, number> = {
                    devEffort: results.avgDevEffort,
                    qaEffort: results.avgQaEffort,
                    risk: results.avgRisk,
                    uncertainty: results.avgUncertainty,
                    totalScore: results.totalScore,
                  };
                  return (
                    <td key={c.key} className="py-2 px-1.5 text-center">
                      <span className="inline-flex h-6 w-8 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {medianMap[c.key]}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
