"use client";

import { differenceInCalendarDays, startOfDay } from "date-fns";
import type {
  BoardAssignment,
  BoardMember,
} from "@/hooks/use-board-polling";
import { COLUMN_WIDTH } from "./gantt-header";
import { ROW_HEIGHT } from "./gantt-member-list";
import { workingDaysToCalendarSpan } from "@/lib/date-utils";

interface Props {
  assignments: BoardAssignment[];
  members: BoardMember[];
  firstSprintStart: Date;
  rowHeights: Map<string, number>;
}

function getMemberYOffset(
  memberId: string,
  members: BoardMember[],
  rowHeights: Map<string, number>,
): number {
  const devs = members.filter((m) => m.role === "DEV");
  const qas = members.filter((m) => m.role === "QA");

  const sectionHeaderHeight = 28;
  let y = 0;

  if (devs.length > 0) {
    y += sectionHeaderHeight;
    for (const m of devs) {
      if (m.id === memberId) return y;
      y += rowHeights.get(m.id) ?? ROW_HEIGHT;
    }
  }

  if (qas.length > 0) {
    y += sectionHeaderHeight;
    for (const m of qas) {
      if (m.id === memberId) return y;
      y += rowHeights.get(m.id) ?? ROW_HEIGHT;
    }
  }

  return y;
}

export function GanttDependencyLines({
  assignments,
  members,
  firstSprintStart,
  rowHeights,
}: Props) {
  const childAssignments = assignments.filter((a) => a.parentAssignmentId);

  if (childAssignments.length === 0) return null;

  const lines = childAssignments
    .map((child) => {
      const parent = assignments.find((a) => a.id === child.parentAssignmentId);
      if (!parent) return null;

      const parentDayOffset = differenceInCalendarDays(
        startOfDay(new Date(parent.startDate)),
        firstSprintStart,
      );
      const parentCalSpan = workingDaysToCalendarSpan(
        new Date(parent.startDate),
        parent.durationDays,
      );
      const parentEndX =
        (parentDayOffset + parentCalSpan) * COLUMN_WIDTH;
      const parentY =
        getMemberYOffset(parent.userId, members, rowHeights) +
        ROW_HEIGHT / 2;

      const childDayOffset = differenceInCalendarDays(
        startOfDay(new Date(child.startDate)),
        firstSprintStart,
      );
      const childStartX = childDayOffset * COLUMN_WIDTH;
      const childY =
        getMemberYOffset(child.userId, members, rowHeights) +
        ROW_HEIGHT / 2;

      return { parentEndX, parentY, childStartX, childY, id: child.id };
    })
    .filter(Boolean) as Array<{
    parentEndX: number;
    parentY: number;
    childStartX: number;
    childY: number;
    id: string;
  }>;

  if (lines.length === 0) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 z-[6] h-full w-full overflow-visible">
      <defs>
        <marker
          id="dep-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
        </marker>
      </defs>
      {lines.map(({ parentEndX, parentY, childStartX, childY, id }) => {
        const midX = (parentEndX + childStartX) / 2;

        return (
          <path
            key={id}
            d={`M ${parentEndX} ${parentY} C ${midX} ${parentY}, ${midX} ${childY}, ${childStartX} ${childY}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            markerEnd="url(#dep-arrow)"
          />
        );
      })}
    </svg>
  );
}
