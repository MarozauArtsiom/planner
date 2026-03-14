"use client";

import { useRef, useEffect } from "react";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { BoardSprint, BoardMember } from "@/hooks/use-board-polling";
import { GanttHeader, COLUMN_WIDTH } from "./gantt-header";
import { GanttMemberList, MEMBER_COL_WIDTH } from "./gantt-member-list";
import { GanttGrid } from "./gantt-grid";
import { TodayMarker } from "./today-marker";
import { generateDayColumns } from "@/lib/date-utils";

const HEADER_HEIGHT = 60;

interface Props {
  sprints: BoardSprint[];
  members: BoardMember[];
  projectId: string;
  isSM: boolean;
}

export function GanttTimeline({ sprints, members, projectId, isSM }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const didScrollRef = useRef(false);

  const allDays = sprints.flatMap((s) =>
    generateDayColumns(new Date(s.startDate), new Date(s.endDate)),
  );
  const totalWidth = allDays.length * COLUMN_WIDTH;

  useEffect(() => {
    if (didScrollRef.current || !scrollRef.current || sprints.length === 0)
      return;

    const container = scrollRef.current;
    const today = startOfDay(new Date());
    const firstStart = startOfDay(new Date(sprints[0].startDate));
    const lastEnd = startOfDay(new Date(sprints[sprints.length - 1].endDate));

    let targetScroll: number;

    if (today >= firstStart && today <= lastEnd) {
      const dayOffset = differenceInCalendarDays(today, firstStart);
      targetScroll =
        MEMBER_COL_WIDTH +
        dayOffset * COLUMN_WIDTH -
        container.clientWidth / 2 +
        COLUMN_WIDTH / 2;
    } else {
      targetScroll = container.scrollWidth - container.clientWidth;
    }

    container.scrollLeft = Math.max(0, targetScroll);
    didScrollRef.current = true;
  }, [sprints]);

  return (
    <div
      ref={scrollRef}
      className="relative flex-1 overflow-x-auto overflow-y-auto"
    >
      <div className="relative flex" style={{ minWidth: MEMBER_COL_WIDTH + totalWidth }}>
        <GanttMemberList members={members} headerHeight={HEADER_HEIGHT} />

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
            <GanttGrid sprints={sprints} members={members} />
            <TodayMarker sprints={sprints} headerHeight={0} />
          </div>
        </div>
      </div>
    </div>
  );
}
