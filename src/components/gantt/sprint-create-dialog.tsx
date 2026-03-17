"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  getDay,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { createSprint } from "@/app/actions/sprint";

function getMondayOffset(date: Date): number {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
}

interface Props {
  projectId: string;
  onCreated: () => void;
  onCancel: () => void;
}

export function SprintCreateDialog({ projectId, onCreated, onCancel }: Props) {
  const t = useTranslations("gantt");
  const [baseMonth, setBaseMonth] = useState(() => startOfMonth(new Date()));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const months = [baseMonth, addMonths(baseMonth, 1)];
  const weekdays = t.raw("weekdays") as string[];

  function handleSelect(date: Date) {
    setError(null);
    startTransition(async () => {
      const result = await createSprint(projectId, date.toISOString());
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        onCreated();
      }
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("selectStartDate")}</h3>
        <button onClick={onCancel} className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setBaseMonth(addMonths(baseMonth, -1))} className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <button onClick={() => setBaseMonth(addMonths(baseMonth, 1))} className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {months.map((month) => {
          const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
          const offset = getMondayOffset(days[0]);
          return (
            <div key={month.toISOString()}>
              <p className="mb-2 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">{format(month, "LLLL yyyy")}</p>
              <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                {weekdays.map((h: string) => <div key={h} className="py-1 font-medium text-zinc-400">{h}</div>)}
                {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}
                {days.map((day) => {
                  const past = isBefore(startOfDay(day), startOfDay(new Date()));
                  const weekend = getDay(day) === 0 || getDay(day) === 6;
                  return (
                    <button
                      key={day.toISOString()}
                      disabled={isPending}
                      onClick={() => handleSelect(day)}
                      className={`cursor-pointer rounded py-1.5 text-xs transition-colors ${past ? "bg-amber-50 font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50" : weekend ? "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800" : "bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"}`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">{t("calendarHint")}</p>
    </div>
  );
}
