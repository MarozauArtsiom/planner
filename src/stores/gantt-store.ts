import { create } from "zustand";
import { addDays } from "date-fns";
import type { BoardAssignment } from "@/hooks/use-board-polling";
import { workingDaysToCalendarSpan } from "@/lib/date-utils";

interface GanttStore {
  assignments: BoardAssignment[];
  isDragging: boolean;

  syncFromServer(serverAssignments: BoardAssignment[]): void;
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
  isDragging: false,

  syncFromServer(serverAssignments) {
    if (get().isDragging) return;
    set({ assignments: serverAssignments });
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
    set((s) => ({
      assignments: s.assignments.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            durationDays,
            ...(startDate ? { startDate } : {}),
          };
        }
        if (a.parentAssignmentId === id) {
          const parentStart = startDate
            ? new Date(startDate)
            : new Date(
                s.assignments.find((p) => p.id === id)?.startDate ?? a.startDate,
              );
          const devCalSpan = workingDaysToCalendarSpan(parentStart, durationDays);
          const devEnd = addDays(parentStart, devCalSpan);
          if (new Date(a.startDate) < devEnd) {
            return { ...a, startDate: devEnd.toISOString() };
          }
        }
        return a;
      }),
    }));
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
