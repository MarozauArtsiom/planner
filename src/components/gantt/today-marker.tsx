"use client";

import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { BoardSprint } from "@/hooks/use-board-polling";
import { COLUMN_WIDTH } from "./gantt-header";

interface Props {
  sprints: BoardSprint[];
  headerHeight: number;
}

export function TodayMarker({ sprints, headerHeight }: Props) {
  if (sprints.length === 0) return null;

  const today = startOfDay(new Date());
  const firstStart = startOfDay(new Date(sprints[0].startDate));
  const lastEnd = startOfDay(new Date(sprints[sprints.length - 1].endDate));

  if (today < firstStart || today > lastEnd) return null;

  const dayOffset = differenceInCalendarDays(today, firstStart);
  const left = dayOffset * COLUMN_WIDTH + COLUMN_WIDTH / 2;

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{
        left,
        top: headerHeight,
        bottom: 0,
        width: 2,
      }}
    >
      <div className="h-full w-full bg-red-500/70" />
      <div
        className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500"
        style={{ top: -4 }}
      />
    </div>
  );
}
