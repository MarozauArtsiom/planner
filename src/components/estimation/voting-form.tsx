"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { submitVote } from "@/app/actions/estimation";
import type { EstimationConfig } from "@/hooks/use-estimation-polling";

interface VotingFormProps {
  projectId: string;
  config: EstimationConfig;
  onSuccess: () => void;
}

export function VotingForm({ projectId, config, onSuccess }: VotingFormProps) {
  if (config.method === "COMPOSITE_SP") {
    return <VotingFormComposite projectId={projectId} onSuccess={onSuccess} />;
  }
  return <VotingFormSimple projectId={projectId} config={config} onSuccess={onSuccess} />;
}

// =====================================================================
// COMPOSITE_SP (оригинальная 4-факторная форма)
// =====================================================================

type CriterionKey = "devEffort" | "qaEffort" | "risk" | "uncertainty";

function VotingFormComposite({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("votingForm");

  const CRITERIA = [
    {
      key: "devEffort" as CriterionKey,
      label: t("devEffort"),
      description: t("devEffortDesc"),
      options: [
        { value: 1, label: t("devOpt1") },
        { value: 2, label: t("devOpt2") },
        { value: 4, label: t("devOpt3") },
        { value: 6, label: t("devOpt4") },
      ],
      accent: {
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        border: "border-indigo-200 dark:border-indigo-800",
        selected:
          "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500",
        dot: "bg-indigo-500",
      },
    },
    {
      key: "qaEffort" as CriterionKey,
      label: t("qaEffort"),
      description: t("qaEffortDesc"),
      options: [
        { value: 1, label: t("qaOpt1") },
        { value: 2, label: t("qaOpt2") },
        { value: 4, label: t("qaOpt3") },
      ],
      accent: {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        border: "border-emerald-200 dark:border-emerald-800",
        selected:
          "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500",
        dot: "bg-emerald-500",
      },
    },
    {
      key: "risk" as CriterionKey,
      label: t("risk"),
      description: t("riskDesc"),
      options: [
        { value: 0, label: t("riskLow") },
        { value: 1, label: t("riskMedium") },
        { value: 2, label: t("riskHigh") },
      ],
      accent: {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        border: "border-amber-200 dark:border-amber-800",
        selected:
          "bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500",
        dot: "bg-amber-500",
      },
    },
    {
      key: "uncertainty" as CriterionKey,
      label: t("uncertainty"),
      description: t("uncertaintyDesc"),
      options: [
        { value: 0, label: t("uncClear") },
        { value: 1, label: t("uncResearch") },
        { value: 2, label: t("uncBlind") },
      ],
      accent: {
        bg: "bg-violet-50 dark:bg-violet-950/40",
        border: "border-violet-200 dark:border-violet-800",
        selected:
          "bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:border-violet-500",
        dot: "bg-violet-500",
      },
    },
  ];

  const [selected, setSelected] = useState<Record<CriterionKey, number | null>>({
    devEffort: null,
    qaEffort: null,
    risk: null,
    uncertainty: null,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allSelected = Object.values(selected).every((v) => v !== null);

  const handleSubmit = () => {
    if (!allSelected) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("devEffort", String(selected.devEffort));
      formData.set("qaEffort", String(selected.qaEffort));
      formData.set("risk", String(selected.risk));
      formData.set("uncertainty", String(selected.uncertainty));
      const result = await submitVote(projectId, formData);
      if (result && "error" in result) {
        setError(result.error ?? t("errorFallback"));
      } else {
        onSuccess();
      }
    });
  };

  return (
    <div className="space-y-4">
      {CRITERIA.map((criterion) => (
        <div
          key={criterion.key}
          className={`rounded-xl border p-4 ${criterion.accent.bg} ${criterion.accent.border}`}
        >
          <div className="mb-3 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${criterion.accent.dot}`} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {criterion.label}
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {criterion.description}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {criterion.options.map((option) => {
              const isSelected = selected[criterion.key] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    setSelected((s) => ({ ...s, [criterion.key]: option.value }))
                  }
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all sm:px-5 ${
                    isSelected
                      ? criterion.accent.selected
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                  } ${isPending ? "opacity-60" : ""}`}
                >
                  <span className="block text-lg font-bold leading-none">
                    {option.value}
                  </span>
                  <span className="mt-1 block text-xs leading-tight opacity-80">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={!allSelected || isPending}
        onClick={handleSubmit}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isPending ? t("submitPending") : t("submitButton")}
      </button>
    </div>
  );
}

// =====================================================================
// FIBONACCI_SP / HOURS / DAYS (одно число)
// =====================================================================

function formatSimpleValue(value: number, method: EstimationConfig["method"]): string {
  if (method === "HOURS") return `${value}h`;
  if (method === "DAYS") {
    if (Number.isInteger(value)) return `${value}d`;
    return `${value}d`;
  }
  return String(value);
}

function VotingFormSimple({
  projectId,
  config,
  onSuccess,
}: {
  projectId: string;
  config: EstimationConfig;
  onSuccess: () => void;
}) {
  const t = useTranslations("votingForm");
  const [selected, setSelected] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selected == null) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("singleValue", String(selected));
      const result = await submitVote(projectId, formData);
      if (result && "error" in result) {
        setError(result.error ?? t("errorFallback"));
      } else {
        onSuccess();
      }
    });
  };

  const methodLabel =
    config.method === "FIBONACCI_SP"
      ? t("simpleFibonacciLabel")
      : config.method === "HOURS"
        ? t("simpleHoursLabel")
        : t("simpleDaysLabel");
  const methodDesc =
    config.method === "FIBONACCI_SP"
      ? t("simpleFibonacciDesc")
      : config.method === "HOURS"
        ? t("simpleHoursDesc")
        : t("simpleDaysDesc");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {methodLabel}
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {methodDesc}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {config.shape.map((value) => {
            const isSelected = selected === value;
            return (
              <button
                key={value}
                type="button"
                disabled={isPending}
                onClick={() => setSelected(value)}
                className={`flex flex-col items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all sm:px-5 ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                } ${isPending ? "opacity-60" : ""}`}
              >
                <span className="block text-lg font-bold leading-none">
                  {formatSimpleValue(value, config.method)}
                </span>
                {config.method === "HOURS" && (
                  <span className="mt-1 block text-[10px] leading-tight opacity-70">
                    {t("hoursApproxDays", {
                      days: Math.max(
                        1,
                        Math.ceil(value / Math.max(1, config.workingHoursPerDay)),
                      ),
                    })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={selected == null || isPending}
        onClick={handleSubmit}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isPending ? t("submitPending") : t("submitButton")}
      </button>
    </div>
  );
}
