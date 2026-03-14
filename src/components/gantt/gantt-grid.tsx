"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import type {
  BoardSprint,
  BoardMember,
  BoardAssignment,
  BoardTimeOff,
} from "@/hooks/use-board-polling";
import {
  generateDayColumns,
  isWeekend,
  workingDaysToCalendarSpan,
  toDateKey,
} from "@/lib/date-utils";
import { COLUMN_WIDTH } from "./gantt-header";
import { ROW_HEIGHT } from "./gantt-member-list";
import { GanttTicketBlock } from "./gantt-ticket-block";
import { computeSubRows } from "@/lib/gantt-layout";

const TIME_OFF_HATCHING =
  "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(161,161,170,0.25) 3px, rgba(161,161,170,0.25) 6px)";

interface Props {
  sprints: BoardSprint[];
  members: BoardMember[];
  assignments: BoardAssignment[];
  timeOffs: BoardTimeOff[];
  isSM: boolean;
  rowHeights: Map<string, number>;
  onResizeStart?: (
    id: string,
    edge: "left" | "right",
    e: React.PointerEvent,
  ) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  onToggleTimeOff?: (userId: string, date: Date) => void;
}

function DroppableMemberRow({
  member,
  allDays,
  assignments,
  firstSprintStart,
  rowHeight,
  isSM,
  memberTimeOffKeys,
  onResizeStart,
  onContextMenu,
  onDelete,
  onToggleTimeOff,
}: {
  member: BoardMember;
  allDays: Date[];
  assignments: BoardAssignment[];
  firstSprintStart: Date;
  rowHeight: number;
  isSM: boolean;
  memberTimeOffKeys: Set<string>;
  onResizeStart?: Props["onResizeStart"];
  onContextMenu?: Props["onContextMenu"];
  onDelete?: Props["onDelete"];
  onToggleTimeOff?: Props["onToggleTimeOff"];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `member-${member.id}`,
    data: { memberId: member.id, memberRole: member.role },
  });

  const subRowMap = computeSubRows(assignments);

  return (
    <div
      ref={setNodeRef}
      className={`relative border-b border-zinc-100 dark:border-zinc-800 ${
        isOver ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
      }`}
      style={{ height: rowHeight }}
    >
      <div className="flex" style={{ height: rowHeight }}>
        {allDays.map((day, colIdx) => {
          const weekend = isWeekend(day);
          const lastInSprint = (colIdx + 1) % 7 === 0;
          const isTimeOff = !weekend && memberTimeOffKeys.has(toDateKey(day));
          const canToggle = isSM && !weekend;

          return (
            <div
              key={day.toISOString()}
              className={`flex-shrink-0 ${
                weekend ? "bg-zinc-50 dark:bg-zinc-800/30" : ""
              } ${
                lastInSprint
                  ? "border-r-2 border-zinc-300 dark:border-zinc-600"
                  : "border-r border-zinc-50 dark:border-zinc-800/50"
              } ${canToggle ? "cursor-pointer" : ""}`}
              style={{
                width: COLUMN_WIDTH,
                height: rowHeight,
                ...(isTimeOff ? { background: TIME_OFF_HATCHING } : {}),
              }}
              onClick={
                canToggle
                  ? () => onToggleTimeOff?.(member.id, day)
                  : undefined
              }
            />
          );
        })}
      </div>

      {assignments.map((a) => {
        const dayOffset = differenceInCalendarDays(
          startOfDay(new Date(a.startDate)),
          firstSprintStart,
        );
        const subRow = subRowMap.get(a.id) ?? 0;
        const calSpan = workingDaysToCalendarSpan(
          new Date(a.startDate),
          a.durationDays,
          memberTimeOffKeys,
        );

        return (
          <GanttTicketBlock
            key={a.id}
            id={a.id}
            ticketId={a.ticketId}
            ticketTitle={a.ticketTitle}
            ticketExternalId={a.ticketExternalId}
            calendarSpan={calSpan}
            durationDays={a.durationDays}
            type={a.type}
            dayOffset={dayOffset}
            subRow={subRow}
            isSM={isSM}
            onResizeStart={onResizeStart}
            onContextMenu={onContextMenu}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}

export function GanttGrid({
  sprints,
  members,
  assignments,
  timeOffs,
  isSM,
  rowHeights,
  onResizeStart,
  onContextMenu,
  onDelete,
  onToggleTimeOff,
}: Props) {
  const allDays = sprints.flatMap((s) =>
    generateDayColumns(new Date(s.startDate), new Date(s.endDate)),
  );

  const firstSprintStart =
    sprints.length > 0
      ? startOfDay(new Date(sprints[0].startDate))
      : startOfDay(new Date());

  const timeOffByUser = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const t of timeOffs) {
      let set = map.get(t.userId);
      if (!set) {
        set = new Set();
        map.set(t.userId, set);
      }
      set.add(toDateKey(new Date(t.date)));
    }
    return map;
  }, [timeOffs]);

  const devs = members.filter((m) => m.role === "DEV");
  const qas = members.filter((m) => m.role === "QA");

  const sectionHeaderHeight = 28;

  const rows: Array<
    | { type: "section-header"; label: string }
    | { type: "member"; member: BoardMember }
  > = [];

  if (devs.length > 0) {
    rows.push({ type: "section-header", label: "Dev" });
    devs.forEach((m) => rows.push({ type: "member", member: m }));
  }
  if (qas.length > 0) {
    rows.push({ type: "section-header", label: "QA" });
    qas.forEach((m) => rows.push({ type: "member", member: m }));
  }

  return (
    <div
      id="gantt-grid-area"
      style={{ width: allDays.length * COLUMN_WIDTH }}
    >
      {rows.map((row) => {
        if (row.type === "section-header") {
          return (
            <div
              key={`section-${row.label}`}
              className="border-b border-zinc-200 dark:border-zinc-700"
              style={{ height: sectionHeaderHeight }}
            />
          );
        }

        const memberAssignments = assignments.filter(
          (a) => a.userId === row.member.id,
        );
        const height = rowHeights.get(row.member.id) ?? ROW_HEIGHT;
        const memberTimeOffKeys = timeOffByUser.get(row.member.id) ?? new Set();

        return (
          <DroppableMemberRow
            key={row.member.id}
            member={row.member}
            allDays={allDays}
            assignments={memberAssignments}
            firstSprintStart={firstSprintStart}
            rowHeight={height}
            isSM={isSM}
            memberTimeOffKeys={memberTimeOffKeys}
            onResizeStart={onResizeStart}
            onContextMenu={onContextMenu}
            onDelete={onDelete}
            onToggleTimeOff={onToggleTimeOff}
          />
        );
      })}
    </div>
  );
}
