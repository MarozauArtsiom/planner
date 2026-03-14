"use client";

import { useState, useTransition } from "react";
import { submitVote } from "@/app/actions/estimation";

const CRITERIA = [
  {
    key: "devEffort",
    label: "Dev Effort",
    description: "Объём работы для разработки",
    options: [
      { value: 1, label: "< 1 дня" },
      { value: 2, label: "1–2 дня" },
      { value: 4, label: "3–4 дня" },
      { value: 6, label: "5+ дней" },
    ],
    accent: {
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-200 dark:border-indigo-800",
      selected: "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500",
      dot: "bg-indigo-500",
    },
  },
  {
    key: "qaEffort",
    label: "QA Effort",
    description: "Объём работы для тестирования",
    options: [
      { value: 1, label: "Базовая проверка" },
      { value: 2, label: "Автотесты / Регресс" },
      { value: 4, label: "3+ дней" },
    ],
    accent: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
      selected: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500",
      dot: "bg-emerald-500",
    },
  },
  {
    key: "risk",
    label: "Risk",
    description: "Уровень технического риска",
    options: [
      { value: 0, label: "Низкий" },
      { value: 1, label: "Средний" },
      { value: 2, label: "Высокий" },
    ],
    accent: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800",
      selected: "bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500",
      dot: "bg-amber-500",
    },
  },
  {
    key: "uncertainty",
    label: "Uncertainty",
    description: "Уровень неопределённости",
    options: [
      { value: 0, label: "Всё понятно" },
      { value: 1, label: "Нужен ресерч" },
      { value: 2, label: "Полный блайнд" },
    ],
    accent: {
      bg: "bg-violet-50 dark:bg-violet-950/40",
      border: "border-violet-200 dark:border-violet-800",
      selected: "bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:border-violet-500",
      dot: "bg-violet-500",
    },
  },
] as const;

type CriterionKey = (typeof CRITERIA)[number]["key"];

export function VotingForm({ projectId, onSuccess }: { projectId: string; onSuccess: () => void }) {
  const [selected, setSelected] = useState<Record<CriterionKey, number | null>>({
    devEffort: null, qaEffort: null, risk: null, uncertainty: null,
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
        setError(result.error ?? "Произошла ошибка");
      } else {
        onSuccess();
      }
    });
  };

  return (
    <div className="space-y-4">
      {CRITERIA.map((criterion) => (
        <div key={criterion.key} className={`rounded-xl border p-4 ${criterion.accent.bg} ${criterion.accent.border}`}>
          <div className="mb-3 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${criterion.accent.dot}`} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{criterion.label}</h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{criterion.description}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {criterion.options.map((option) => {
              const isSelected = selected[criterion.key] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => setSelected((s) => ({ ...s, [criterion.key]: option.value }))}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all sm:px-5 ${
                    isSelected
                      ? criterion.accent.selected
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                  } ${isPending ? "opacity-60" : ""}`}
                >
                  <span className="block text-lg font-bold leading-none">{option.value}</span>
                  <span className="mt-1 block text-xs leading-tight opacity-80">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{error}</p>
      )}
      <button
        type="button"
        disabled={!allSelected || isPending}
        onClick={handleSubmit}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isPending ? "Отправка..." : "Отправить оценку"}
      </button>
    </div>
  );
}
