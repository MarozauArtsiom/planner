"use client";

import { useRef, useEffect } from "react";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import type {
  BoardSprint,
  BoardMember,
  BoardAssignment,
  BoardTimeOff,
} from "@/hooks/use-board-polling";
import { GanttHeader, COLUMN_WIDTH } from "./gantt-header";
import { GanttMemberList, MEMBER_COL_WIDTH } from "./gantt-member-list";
import { GanttGrid } from "./gantt-grid";
import { GanttDependencyLines } from "./gantt-dependency-lines";
import { TodayMarker } from "./today-marker";
import { generateDayColumns } from "@/lib/date-utils";
import { computeRowHeights } from "@/lib/gantt-layout";

const HEADER_HEIGHT = 60;

interface Props {
  sprints: BoardSprint[];
  members: BoardMember[];
  assignments: BoardAssignment[];
  timeOffs: BoardTimeOff[];
  projectId: string;
  isSM: boolean;
  onResizeStart?: (
    id: string,
    edge: "left" | "right",
    e: React.PointerEvent,
  ) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  onToggleTimeOff?: (userId: string, date: Date) => void;
}

export function GanttTimeline({
  sprints,
  members,
  assignments,
  timeOffs,
  projectId,
  isSM,
  onResizeStart,
  onContextMenu,
  onDelete,
  onToggleTimeOff,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const didScrollRef = useRef(false);

  const allDays = sprints.flatMap((s) =>
    generateDayColumns(new Date(s.startDate), new Date(s.endDate)),
  );
  const totalWidth = allDays.length * COLUMN_WIDTH;

  const rowHeights = computeRowHeights(members, assignments);

  useEffect(() => {
    if (didScrollRef.current || !scrollRef.current || sprints.length === 0)
      return;

    const today = startOfDay(new Date());
    const firstStart = startOfDay(new Date(sprints[0].startDate));

    const currentSprint = sprints.find((s) => {
      const sStart = startOfDay(new Date(s.startDate));
      const sEnd = startOfDay(new Date(s.endDate));
      return today >= sStart && today <= sEnd;
    });

    let targetScroll: number;

    if (currentSprint) {
      const sprintStartOffset = differenceInCalendarDays(
        startOfDay(new Date(currentSprint.startDate)),
        firstStart,
      );
      targetScroll = sprintStartOffset * COLUMN_WIDTH;
    } else {
      const lastSprint = sprints[sprints.length - 1];
      const lastStartOffset = differenceInCalendarDays(
        startOfDay(new Date(lastSprint.startDate)),
        firstStart,
      );
      targetScroll = lastStartOffset * COLUMN_WIDTH;
    }

    scrollRef.current.scrollLeft = Math.max(0, targetScroll);
    didScrollRef.current = true;
  }, [sprints]);

  return (
    <div
      ref={scrollRef}
      className="relative flex-1 overflow-x-auto overflow-y-auto"
    >
      <div
        className="relative flex"
        style={{ minWidth: MEMBER_COL_WIDTH + totalWidth }}
      >
        <GanttMemberList
          members={members}
          headerHeight={HEADER_HEIGHT}
          rowHeights={rowHeights}
        />

        <div className="relative" style={{ width: totalWidth }}>
          <div
            className="sticky top-0 z-10 bg-white dark:bg-zinc-950"
            style={{ height: HEADER_HEIGHT }}
          >
            <GanttHeader
              sprints={sprints}
              projectId={projectId}
              isSM={isSM}
            />
          </div>

          <div className="relative">
            <GanttGrid
              sprints={sprints}
              members={members}
              assignments={assignments}
              timeOffs={timeOffs}
              isSM={isSM}
              rowHeights={rowHeights}
              onResizeStart={onResizeStart}
              onContextMenu={onContextMenu}
              onDelete={onDelete}
              onToggleTimeOff={onToggleTimeOff}
            />
            <GanttDependencyLines
              assignments={assignments}
              members={members}
              firstSprintStart={
                sprints.length > 0
                  ? startOfDay(new Date(sprints[0].startDate))
                  : startOfDay(new Date())
              }
              rowHeights={rowHeights}
            />
            <TodayMarker sprints={sprints} headerHeight={0} />
          </div>
        </div>
      </div>
    </div>
  );
}
