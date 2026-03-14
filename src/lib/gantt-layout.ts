import type { BoardAssignment } from "@/hooks/use-board-polling";
import { startOfDay } from "date-fns";
import { ROW_HEIGHT } from "@/components/gantt/gantt-member-list";
import { workingDaysToCalendarSpan } from "@/lib/date-utils";

export function computeSubRows(
  assignments: BoardAssignment[],
): Map<string, number> {
  const result = new Map<string, number>();
  if (assignments.length === 0) return result;

  const sorted = [...assignments].sort((a, b) => {
    const startDiff =
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    if (startDiff !== 0) return startDiff;
    return b.durationDays - a.durationDays;
  });

  const subRowEnds: number[] = [];

  for (const assignment of sorted) {
    const start = startOfDay(new Date(assignment.startDate)).getTime();
    const calSpan = workingDaysToCalendarSpan(
      new Date(assignment.startDate),
      assignment.durationDays,
    );
    const end = start + calSpan * 86400000;

    let placed = false;
    for (let row = 0; row < subRowEnds.length; row++) {
      if (subRowEnds[row] <= start) {
        result.set(assignment.id, row);
        subRowEnds[row] = end;
        placed = true;
        break;
      }
    }

    if (!placed) {
      result.set(assignment.id, subRowEnds.length);
      subRowEnds.push(end);
    }
  }

  return result;
}

export function computeRowHeights(
  members: Array<{ id: string }>,
  assignments: BoardAssignment[],
): Map<string, number> {
  const heights = new Map<string, number>();

  for (const member of members) {
    const memberAssignments = assignments.filter(
      (a) => a.userId === member.id,
    );
    const subRowMap = computeSubRows(memberAssignments);
    const maxSubRow =
      subRowMap.size > 0
        ? Math.max(...Array.from(subRowMap.values())) + 1
        : 1;
    heights.set(member.id, Math.max(1, maxSubRow) * ROW_HEIGHT);
  }

  return heights;
}
