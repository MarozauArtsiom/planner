"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { format, isBefore, isAfter, startOfDay } from "date-fns";
import type { BoardSprint } from "@/hooks/use-board-polling";
import { isWeekend, isToday, generateDayColumns } from "@/lib/date-utils";
import { renameSprint } from "@/app/actions/sprint";
import { setActiveSprint } from "@/app/actions/project";

export const COLUMN_WIDTH = 48;

interface Props {
  sprints: BoardSprint[];
  projectId: string;
  isSM: boolean;
  activeSprintId?: string | null;
  onRefresh?: () => void;
}

function getSprintStatus(sprint: BoardSprint): "past" | "current" | "future" {
  const now = startOfDay(new Date());
  const start = startOfDay(new Date(sprint.startDate));
  const end = startOfDay(new Date(sprint.endDate));

  if (isAfter(now, end)) return "past";
  if (isBefore(now, start)) return "future";
  return "current";
}

const STATUS_STYLES = {
  past: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400",
  current: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  future: "bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
};

function SprintNameCell({
  sprint,
  projectId,
  isSM,
  colSpan,
  status,
  isActive,
  onSetActive,
}: {
  sprint: BoardSprint;
  projectId: string;
  isSM: boolean;
  colSpan: number;
  status: "past" | "current" | "future";
  isActive: boolean;
  onSetActive?: () => void;
}) {
  const t = useTranslations("gantt");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sprint.name);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(sprint.name);
  }, [sprint.name]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === sprint.name) {
      setName(sprint.name);
      return;
    }
    startTransition(async () => {
      const result = await renameSprint(sprint.id, projectId, trimmed);
      if (result && "error" in result) setName(sprint.name);
    });
  }

  const activeRing = isActive
    ? "ring-2 ring-inset ring-amber-400 dark:ring-amber-500"
    : "";

  return (
    <div
      className={`flex items-center justify-center border-r-2 border-zinc-300 px-2 dark:border-zinc-600 ${STATUS_STYLES[status]} ${activeRing}`}
      style={{ width: colSpan * COLUMN_WIDTH }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setName(sprint.name);
              setEditing(false);
            }
          }}
          disabled={isPending}
          className="w-full rounded border border-blue-300 bg-white px-1.5 py-0.5 text-center text-xs font-semibold outline-none dark:border-blue-600 dark:bg-zinc-800"
          maxLength={100}
        />
      ) : (
        <div className="flex items-center gap-1.5 overflow-hidden">
          {isActive && (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
          )}
          <span
            onClick={() => isSM && setEditing(true)}
            className={`truncate text-xs font-semibold ${isSM ? "cursor-pointer hover:underline" : ""}`}
          >
            {sprint.name}
          </span>
          {isSM && !isActive && onSetActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetActive();
              }}
              disabled={isPending}
              className="ml-auto flex-shrink-0 rounded px-1 py-0.5 text-[9px] font-medium text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-700/60 dark:hover:text-zinc-200"
              title={t("makeActive")}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function GanttHeader({ sprints, projectId, isSM, activeSprintId, onRefresh }: Props) {
  const [, startTransition] = useTransition();
  const allDays = sprints.flatMap((s) =>
    generateDayColumns(new Date(s.startDate), new Date(s.endDate)),
  );

  const handleSetActive = (sprintId: string) => {
    startTransition(async () => {
      await setActiveSprint(projectId, sprintId);
      onRefresh?.();
    });
  };

  return (
    <div style={{ width: allDays.length * COLUMN_WIDTH }}>
      <div className="flex h-8 border-b border-zinc-200 dark:border-zinc-700">
        {sprints.map((sprint) => {
          const days = generateDayColumns(
            new Date(sprint.startDate),
            new Date(sprint.endDate),
          );
          const status = getSprintStatus(sprint);
          return (
            <SprintNameCell
              key={sprint.id}
              sprint={sprint}
              projectId={projectId}
              isSM={isSM}
              colSpan={days.length}
              status={status}
              isActive={sprint.id === activeSprintId}
              onSetActive={() => handleSetActive(sprint.id)}
            />
          );
        })}
      </div>

      <div className="flex h-7 border-b border-zinc-300 dark:border-zinc-600">
        {allDays.map((day, i) => {
          const weekend = isWeekend(day);
          const today = isToday(day);
          const lastInSprint = (i + 1) % 7 === 0;
          return (
            <div
              key={day.toISOString()}
              className={`flex flex-col items-center justify-center text-[10px] leading-tight ${
                weekend
                  ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-500"
                  : "text-zinc-600 dark:text-zinc-400"
              } ${today ? "font-bold text-blue-600 dark:text-blue-400" : ""} ${
                lastInSprint
                  ? "border-r-2 border-zinc-300 dark:border-zinc-600"
                  : "border-r border-zinc-100 dark:border-zinc-800"
              }`}
              style={{ width: COLUMN_WIDTH }}
            >
              <span>{format(day, "EEE")}</span>
              <span>{format(day, "d")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
