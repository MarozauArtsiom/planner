"use client";

import type { BoardSprint, BoardMember } from "@/hooks/use-board-polling";
import { generateDayColumns, isWeekend } from "@/lib/date-utils";
import { COLUMN_WIDTH } from "./gantt-header";
import { ROW_HEIGHT } from "./gantt-member-list";

interface Props {
  sprints: BoardSprint[];
  members: BoardMember[];
}

export function GanttGrid({ sprints, members }: Props) {
  const allDays = sprints.flatMap((s) =>
    generateDayColumns(new Date(s.startDate), new Date(s.endDate)),
  );

  const devs = members.filter((m) => m.role === "DEV");
  const qas = members.filter((m) => m.role === "QA");

  const sectionHeaderHeight = 28;

  const rows: Array<{ type: "section-header"; label: string; color: string } | { type: "member"; member: BoardMember }> = [];

  if (devs.length > 0) {
    rows.push({ type: "section-header", label: "Dev", color: "indigo" });
    devs.forEach((m) => rows.push({ type: "member", member: m }));
  }
  if (qas.length > 0) {
    rows.push({ type: "section-header", label: "QA", color: "emerald" });
    qas.forEach((m) => rows.push({ type: "member", member: m }));
  }

  return (
    <div style={{ width: allDays.length * COLUMN_WIDTH }}>
      {rows.map((row, rowIdx) => {
        if (row.type === "section-header") {
          return (
            <div
              key={`section-${row.label}`}
              className="border-b border-zinc-200 dark:border-zinc-700"
              style={{ height: sectionHeaderHeight }}
            />
          );
        }

        return (
          <div
            key={row.member.id}
            className="flex border-b border-zinc-100 dark:border-zinc-800"
            style={{ height: ROW_HEIGHT }}
          >
            {allDays.map((day, colIdx) => {
              const weekend = isWeekend(day);
              const lastInSprint = (colIdx + 1) % 7 === 0;
              return (
                <div
                  key={day.toISOString()}
                  className={`flex-shrink-0 ${
                    weekend
                      ? "bg-zinc-50 dark:bg-zinc-800/30"
                      : ""
                  } ${
                    lastInSprint
                      ? "border-r-2 border-zinc-300 dark:border-zinc-600"
                      : "border-r border-zinc-50 dark:border-zinc-800/50"
                  }`}
                  style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
