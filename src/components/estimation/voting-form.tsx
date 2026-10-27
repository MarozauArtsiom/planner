"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  submitVote,
  addCustomEstimationValue,
  removeCustomEstimationValue,
} from "@/app/actions/estimation";
import type {
  EstimationConfig,
  SpScaleOption,
} from "@/hooks/use-estimation-polling";

interface VotingFormProps {
  projectId: string;
  config: EstimationConfig;
  spScale?: SpScaleOption[];
  onSuccess: () => Promise<void> | void;
  onCustomValueChange?: () => Promise<void> | void;
}

function SpinnerIcon({ className = "h-5 w-5" }: { className?: string }) {
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

export function VotingForm({
  projectId,
  config,
  spScale,
  onSuccess,
  onCustomValueChange,
}: VotingFormProps) {
  if (config.method === "COMPOSITE_SP") {
    return (
      <VotingFormComposite
        projectId={projectId}
        config={config}
        spScale={spScale}
        onSuccess={onSuccess}
        onCustomValueChange={onCustomValueChange}
      />
    );
  }
  return (
    <VotingFormSimple
      projectId={projectId}
      config={config}
      onSuccess={onSuccess}
      onCustomValueChange={onCustomValueChange}
    />
  );
}

// =====================================================================
// COMPOSITE_SP (4-факторная форма + шкала SP комнаты)
// =====================================================================

type CriterionKey = "devEffort" | "qaEffort" | "risk" | "uncertainty";

const DEFAULT_COMPOSITE_SP = [0, 1, 2, 3, 5, 8, 13];

function VotingFormComposite({
  projectId,
  config,
  spScale,
  onSuccess,
  onCustomValueChange,
}: {
  projectId: string;
  config: EstimationConfig;
  spScale?: SpScaleOption[];
  onSuccess: () => Promise<void> | void;
  onCustomValueChange?: () => Promise<void> | void;
}) {
  const t = useTranslations("votingForm");

  const CRITERIA = [
    {
      key: "devEffort" as CriterionKey,
      label: t("devEffort"),
      description: t("devEffortDesc"),
      options: [
        { value: 0, label: t("devOpt0") },
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
        { value: 0, label: t("qaOpt0") },
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
  const [isCustomPending, startCustomTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [localAdded, setLocalAdded] = useState<number[]>([]);
  const [localRemoved, setLocalRemoved] = useState<number[]>([]);

  const allSelected = Object.values(selected).every((v) => v !== null);

  const baseSpValues =
    spScale && spScale.length > 0
      ? spScale.map((s) => s.value)
      : DEFAULT_COMPOSITE_SP;
  const customSet = new Set([
    ...(config.customValues ?? []),
    ...localAdded,
  ]);
  for (const r of localRemoved) customSet.delete(r);

  const roomSpValues = Array.from(
    new Set([...baseSpValues, ...Array.from(customSet)]),
  )
    .filter((v) => !localRemoved.includes(v))
    .sort((a, b) => a - b);

  const handleAddCustomSp = () => {
    const parsed = parseInt(customInput.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1000) {
      setError(t("customValueInvalid"));
      return;
    }
    setError(null);
    setLocalAdded((prev) => Array.from(new Set([...prev, parsed])));
    setLocalRemoved((prev) => prev.filter((v) => v !== parsed));
    setCustomInput("");
    setShowAddInput(false);

    startCustomTransition(async () => {
      const res = await addCustomEstimationValue(projectId, parsed);
      if (res && "error" in res) {
        setError(res.error ?? t("errorFallback"));
      } else {
        await onCustomValueChange?.();
      }
    });
  };

  const handleRemoveCustomSp = (val: number) => {
    setLocalRemoved((prev) => Array.from(new Set([...prev, val])));
    startCustomTransition(async () => {
      await removeCustomEstimationValue(projectId, val);
      await onCustomValueChange?.();
    });
  };

  const handleSubmit = () => {
    if (!allSelected || isPending) return;
    setError(null);
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
        await onSuccess();
      }
    });
  };

  return (
    <div
      className={`space-y-4 transition-opacity ${isPending ? "pointer-events-none opacity-80" : ""}`}
      aria-busy={isPending}
    >
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

      {/* Шкала Story Points комнаты + добавление своего значения */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {t("roomSpScaleTitle")}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t("roomSpScaleDesc")}
            </p>
          </div>
          {!showAddInput && (
            <button
              type="button"
              onClick={() => setShowAddInput(true)}
              disabled={isCustomPending}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-blue-400 bg-blue-50/60 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100/70 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
            >
              <span>+</span>
              <span>{t("addCustomValue")}</span>
            </button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {roomSpValues.map((val) => {
            const isCustom = customSet.has(val) && !DEFAULT_COMPOSITE_SP.includes(val);
            return (
              <span
                key={val}
                className="group/chip inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <span>{val} SP</span>
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomSp(val)}
                    title={t("removeCustomValue")}
                    className="ml-0.5 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>

        {showAddInput && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              max={1000}
              step={1}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomSp();
                } else if (e.key === "Escape") {
                  setShowAddInput(false);
                }
              }}
              placeholder={t("customValuePlaceholder")}
              autoFocus
              className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleAddCustomSp}
              disabled={isCustomPending || !customInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500"
            >
              {isCustomPending && <SpinnerIcon className="h-3.5 w-3.5" />}
              <span>{t("addCustomConfirm")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddInput(false);
                setCustomInput("");
              }}
              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {t("addCustomCancel")}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={!allSelected || isPending}
        onClick={handleSubmit}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isPending && <SpinnerIcon />}
        <span>{isPending ? t("submitPending") : t("submitButton")}</span>
      </button>
    </div>
  );
}

// =====================================================================
// FIBONACCI_SP / HOURS / DAYS (одно число + свои оценки для комнаты)
// =====================================================================

function formatSimpleValue(
  value: number,
  method: EstimationConfig["method"],
): string {
  if (method === "HOURS") return `${value}h`;
  if (method === "DAYS") {
    return `${value}d`;
  }
  return String(value);
}

const BASE_SHAPES: Record<string, number[]> = {
  FIBONACCI_SP: [0, 1, 2, 3, 5, 8, 13, 21],
  HOURS: [0, 1, 2, 4, 8, 16, 24, 40],
  DAYS: [0, 0.5, 1, 2, 3, 5, 8, 13],
};

function VotingFormSimple({
  projectId,
  config,
  onSuccess,
  onCustomValueChange,
}: {
  projectId: string;
  config: EstimationConfig;
  onSuccess: () => Promise<void> | void;
  onCustomValueChange?: () => Promise<void> | void;
}) {
  const t = useTranslations("votingForm");
  const [selected, setSelected] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCustomPending, startCustomTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [showAddInput, setShowAddInput] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [localAdded, setLocalAdded] = useState<number[]>([]);
  const [localRemoved, setLocalRemoved] = useState<number[]>([]);

  const baseForMethod = BASE_SHAPES[config.method] ?? [];
  const customSet = new Set([
    ...(config.customValues ?? []),
    ...localAdded,
  ]);
  for (const r of localRemoved) customSet.delete(r);

  const allValues = Array.from(
    new Set([...config.shape, ...localAdded]),
  )
    .filter((v) => !localRemoved.includes(v))
    .sort((a, b) => a - b);

  const handleAddCustom = () => {
    const normalized = customInput.trim().replace(",", ".");
    const parsed = Math.round(parseFloat(normalized) * 100) / 100;
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10000) {
      setError(t("customValueInvalid"));
      return;
    }
    setError(null);
    setLocalAdded((prev) => Array.from(new Set([...prev, parsed])));
    setLocalRemoved((prev) => prev.filter((v) => v !== parsed));
    setSelected(parsed);
    setCustomInput("");
    setShowAddInput(false);

    startCustomTransition(async () => {
      const res = await addCustomEstimationValue(projectId, parsed);
      if (res && "error" in res) {
        setError(res.error ?? t("errorFallback"));
      } else {
        await onCustomValueChange?.();
      }
    });
  };

  const handleRemoveCustom = (e: React.MouseEvent, value: number) => {
    e.stopPropagation();
    setLocalRemoved((prev) => Array.from(new Set([...prev, value])));
    if (selected === value) setSelected(null);

    startCustomTransition(async () => {
      await removeCustomEstimationValue(projectId, value);
      await onCustomValueChange?.();
    });
  };

  const handleSubmit = () => {
    if (selected == null || isPending) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("singleValue", String(selected));
      const result = await submitVote(projectId, formData);
      if (result && "error" in result) {
        setError(result.error ?? t("errorFallback"));
      } else {
        await onSuccess();
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
    <div
      className={`space-y-4 transition-opacity ${isPending ? "pointer-events-none opacity-80" : ""}`}
      aria-busy={isPending}
    >
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {methodLabel}
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {methodDesc}
            </span>
          </div>
          {!showAddInput && (
            <button
              type="button"
              onClick={() => setShowAddInput(true)}
              disabled={isPending || isCustomPending}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-blue-400 bg-white/80 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100/70 dark:border-blue-600 dark:bg-zinc-900/80 dark:text-blue-300 dark:hover:bg-blue-900/40"
            >
              <span>+</span>
              <span>{t("addCustomValue")}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {allValues.map((value) => {
            const isSelected = selected === value;
            const isCustom =
              customSet.has(value) && !baseForMethod.includes(value);
            return (
              <button
                key={value}
                type="button"
                disabled={isPending}
                onClick={() => setSelected(value)}
                className={`group/card relative flex flex-col items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all sm:px-5 ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                } ${isPending ? "opacity-60" : ""}`}
              >
                {isCustom && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => handleRemoveCustom(e, value)}
                    title={t("removeCustomValue")}
                    className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border text-[10px] leading-none opacity-0 transition-opacity group-hover/card:opacity-100 ${
                      isSelected
                        ? "border-blue-300 bg-blue-700 text-white"
                        : "border-zinc-300 bg-white text-zinc-500 hover:text-red-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    ×
                  </span>
                )}
                <span className="block text-lg font-bold leading-none">
                  {formatSimpleValue(value, config.method)}
                </span>
                {config.method === "HOURS" && value > 0 && (
                  <span className="mt-1 block text-[10px] leading-tight opacity-70">
                    {t("hoursApproxDays", {
                      days: Math.max(
                        1,
                        Math.ceil(
                          value / Math.max(1, config.workingHoursPerDay),
                        ),
                      ),
                    })}
                  </span>
                )}
              </button>
            );
          })}

          {!showAddInput && (
            <button
              type="button"
              disabled={isPending || isCustomPending}
              onClick={() => setShowAddInput(true)}
              className="flex flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-white/60 px-4 py-3 text-sm font-medium text-blue-600 transition-all hover:border-blue-400 hover:bg-white sm:px-5 dark:border-blue-700 dark:bg-zinc-900/50 dark:text-blue-400 dark:hover:bg-zinc-900"
              title={t("addCustomValue")}
            >
              <span className="block text-lg font-bold leading-none">+</span>
              <span className="mt-1 block text-[10px] leading-tight">
                {t("addCustomShort")}
              </span>
            </button>
          )}
        </div>

        {showAddInput && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-white p-2.5 dark:border-blue-800 dark:bg-zinc-900">
            <input
              type="number"
              min={0}
              max={10000}
              step="any"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustom();
                } else if (e.key === "Escape") {
                  setShowAddInput(false);
                }
              }}
              placeholder={t("customValuePlaceholder")}
              autoFocus
              className="w-36 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={isCustomPending || !customInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500"
            >
              {isCustomPending && <SpinnerIcon className="h-3.5 w-3.5" />}
              <span>{t("addCustomConfirm")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddInput(false);
                setCustomInput("");
              }}
              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {t("addCustomCancel")}
            </button>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t("customValueSavedHint")}
            </span>
          </div>
        )}
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
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isPending && <SpinnerIcon />}
        <span>{isPending ? t("submitPending") : t("submitButton")}</span>
      </button>
    </div>
  );
}
