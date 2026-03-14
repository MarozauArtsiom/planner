"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { format, isBefore, isAfter, startOfDay } from "date-fns";
import type { BoardSprint } from "@/hooks/use-board-polling";
import { isWeekend, isToday, generateDayColumns } from "@/lib/date-utils";
import { renameSprint } from "@/app/actions/sprint";

export const COLUMN_WIDTH = 48;

interface Props {
  sprints: BoardSprint[];
  projectId: string;
  isSM: boolean;
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
}: {
  sprint: BoardSprint;
  projectId: string;
  isSM: boolean;
  colSpan: number;
  status: "past" | "current" | "future";
}) {
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

  return (
    <div
      className={`flex items-center justify-center border-r-2 border-zinc-300 px-2 dark:border-zinc-600 ${STATUS_STYLES[status]}`}
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
        <span
          onClick={() => isSM && setEditing(true)}
          className={`truncate text-xs font-semibold ${isSM ? "cursor-pointer hover:underline" : ""}`}
        >
          {sprint.name}
        </span>
      )}
    </div>
  );
}

export function GanttHeader({ sprints, projectId, isSM }: Props) {
  const allDays = sprints.flatMap((s) =>
    generateDayColumns(new Date(s.startDate), new Date(s.endDate)),
  );

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
