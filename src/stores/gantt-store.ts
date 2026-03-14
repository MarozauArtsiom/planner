import { create } from "zustand";
import { addDays } from "date-fns";
import type { BoardAssignment, BoardTimeOff } from "@/hooks/use-board-polling";
import { workingDaysToCalendarSpan, toDateKey } from "@/lib/date-utils";

function buildUserTimeOffSet(
  timeOffs: BoardTimeOff[],
  userId: string,
): Set<string> {
  const set = new Set<string>();
  for (const t of timeOffs) {
    if (t.userId === userId) set.add(toDateKey(new Date(t.date)));
  }
  return set;
}

interface GanttStore {
  assignments: BoardAssignment[];
  timeOffs: BoardTimeOff[];
  isDragging: boolean;

  syncFromServer(serverAssignments: BoardAssignment[]): void;
  syncTimeOffs(serverTimeOffs: BoardTimeOff[]): void;
  setDragging(dragging: boolean): void;

  optimisticAdd(assignment: BoardAssignment): void;
  optimisticMove(
    id: string,
    userId: string,
    startDate: string,
  ): void;
  optimisticResize(
    id: string,
    durationDays: number,
    startDate?: string,
  ): void;
  optimisticRemove(id: string): void;
  optimisticSplit(
    devId: string,
    devDurationDays: number,
    qaAssignment: BoardAssignment,
  ): void;
}

export const useGanttStore = create<GanttStore>((set, get) => ({
  assignments: [],
  timeOffs: [],
  isDragging: false,

  syncFromServer(serverAssignments) {
    if (get().isDragging) return;
    set({ assignments: serverAssignments });
  },

  syncTimeOffs(serverTimeOffs) {
    set({ timeOffs: serverTimeOffs });
  },

  setDragging(dragging) {
    set({ isDragging: dragging });
  },

  optimisticAdd(assignment) {
    set((s) => ({ assignments: [...s.assignments, assignment] }));
  },

  optimisticMove(id, userId, startDate) {
    set((s) => {
      const target = s.assignments.find((a) => a.id === id);
      if (!target) return s;

      const oldStart = new Date(target.startDate).getTime();
      const newStart = new Date(startDate).getTime();
      const deltaMs = newStart - oldStart;

      const devTimeOffs = buildUserTimeOffSet(s.timeOffs, userId);

      return {
        assignments: s.assignments.map((a) => {
          if (a.id === id) {
            return { ...a, userId, startDate };
          }
          if (a.parentAssignmentId === id && deltaMs !== 0) {
            const childNewStart = new Date(
              new Date(a.startDate).getTime() + deltaMs,
            );
            const devCalSpan = workingDaysToCalendarSpan(
              new Date(startDate),
              target.durationDays,
              devTimeOffs,
            );
            const devEnd = addDays(new Date(startDate), devCalSpan);
            const effectiveStart =
              childNewStart < devEnd ? devEnd : childNewStart;
            return { ...a, startDate: effectiveStart.toISOString() };
          }
          return a;
        }),
      };
    });
  },

  optimisticResize(id, durationDays, startDate) {
    set((s) => {
      const parent = s.assignments.find((a) => a.id === id);
      const parentUserId = parent?.userId;
      const parentTimeOffs = parentUserId
        ? buildUserTimeOffSet(s.timeOffs, parentUserId)
        : undefined;

      return {
        assignments: s.assignments.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              durationDays,
              ...(startDate ? { startDate } : {}),
            };
          }
          if (a.parentAssignmentId === id) {
            const pStart = startDate
              ? new Date(startDate)
              : new Date(
                  s.assignments.find((p) => p.id === id)?.startDate ??
                    a.startDate,
                );
            const devCalSpan = workingDaysToCalendarSpan(
              pStart,
              durationDays,
              parentTimeOffs,
            );
            const devEnd = addDays(pStart, devCalSpan);
            if (new Date(a.startDate) < devEnd) {
              return { ...a, startDate: devEnd.toISOString() };
            }
          }
          return a;
        }),
      };
    });
  },

  optimisticRemove(id) {
    set((s) => ({
      assignments: s.assignments.filter(
        (a) => a.id !== id && a.parentAssignmentId !== id,
      ),
    }));
  },

  optimisticSplit(devId, devDurationDays, qaAssignment) {
    set((s) => ({
      assignments: [
        ...s.assignments.map((a) =>
          a.id === devId ? { ...a, durationDays: devDurationDays } : a,
        ),
        qaAssignment,
      ],
    }));
  },
}));
