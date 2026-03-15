"use client";

import { useTransition, useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { startOfDay, addDays, differenceInCalendarDays } from "date-fns";
import { useBoardPolling } from "@/hooks/use-board-polling";
import { useGanttStore } from "@/stores/gantt-store";
import { GanttEmptyState } from "./gantt-empty-state";
import { GanttTimeline } from "./gantt-timeline";
import { GanttBacklog } from "./gantt-backlog";
import { COLUMN_WIDTH } from "./gantt-header";
import { createSprint, deleteSprint } from "@/app/actions/sprint";
import {
  assignTicket,
  moveAssignment,
  resizeAssignment as resizeAssignmentAction,
  deleteAssignment,
} from "@/app/actions/assignment";
import { toggleTimeOff } from "@/app/actions/timeoff";
import {
  generateDayColumns,
  workingDaysToCalendarSpan,
  countWorkingDays,
  toDateKey,
} from "@/lib/date-utils";

interface Props {
  projectId: string;
  isSM: boolean;
}

export function GanttBoard({ projectId, isSM }: Props) {
  const t = useTranslations("gantt");
  const tc = useTranslations("common");
  const { state, error, refresh } = useBoardPolling(projectId);
  const [isPending, startTransition] = useTransition();
  const store = useGanttStore();
  const resizeRef = useRef<{
    assignmentId: string;
    edge: "left" | "right";
    startX: number;
    origDuration: number;
    origStartDate: string;
    origCalSpan: number;
    origEndDate: string;
  } | null>(null);

  const dragOffsetRef = useRef(0);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    assignmentId: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    if (state?.assignments) {
      store.syncFromServer(state.assignments);
    }
  }, [state?.assignments]);

  useEffect(() => {
    if (state?.timeOffs) {
      store.syncTimeOffs(state.timeOffs);
    }
  }, [state?.timeOffs]);

  const allDays =
    state?.sprints.flatMap((s) =>
      generateDayColumns(new Date(s.startDate), new Date(s.endDate)),
    ) ?? [];

  const calcDateFromPointer = useCallback(
    (clientX: number): Date | null => {
      const gridEl = document.getElementById("gantt-grid-area");
      if (!gridEl || allDays.length === 0) return null;
      const gridRect = gridEl.getBoundingClientRect();
      const relativeX = clientX - gridRect.left;
      const dayIndex = Math.max(
        0,
        Math.min(allDays.length - 1, Math.floor(relativeX / COLUMN_WIDTH)),
      );
      return allDays[dayIndex];
    },
    [allDays],
  );

  function handleDragStart(event: DragStartEvent) {
    store.setDragging(true);
    const activeData = event.active.data.current as { type: string; assignmentId?: string } | undefined;
    if (activeData?.type === "assignment" && activeData.assignmentId && state) {
      const assignment = store.assignments.find((a) => a.id === activeData.assignmentId);
      if (assignment) {
        const gridEl = document.getElementById("gantt-grid-area");
        if (gridEl) {
          const gridRect = gridEl.getBoundingClientRect();
          const firstStart = startOfDay(new Date(state.sprints[0].startDate));
          const dayOff = differenceInCalendarDays(startOfDay(new Date(assignment.startDate)), firstStart);
          const blockLeft = gridRect.left + dayOff * COLUMN_WIDTH;
          const pointerEvent = event.activatorEvent as PointerEvent;
          dragOffsetRef.current = pointerEvent.clientX - blockLeft;
        }
      }
    } else {
      dragOffsetRef.current = 0;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    store.setDragging(false);
    const { active, over, activatorEvent, delta } = event;
    if (!over) return;
    const overData = over.data.current as { memberId: string; memberRole: string } | undefined;
    if (!overData?.memberId) return;
    const pointerEvent = activatorEvent as PointerEvent;
    const finalCursorX = pointerEvent.clientX + delta.x;
    const finalBlockLeftX = finalCursorX - dragOffsetRef.current;
    const dropDate = calcDateFromPointer(finalBlockLeftX);
    if (!dropDate) return;

    const activeData = active.data.current as {
      type: string; ticketId?: string; assignmentId?: string;
      ticket?: { storyPoints: number; devEffortProportion: number };
    };

    if (activeData.type === "backlog" && activeData.ticketId) {
      const assignmentType = overData.memberRole === "QA" ? ("QA" as const) : ("DEV" as const);
      startTransition(async () => {
        const result = await assignTicket(projectId, activeData.ticketId!, overData.memberId, dropDate.toISOString(), assignmentType);
        if (result && "error" in result) alert(result.error);
        refresh();
      });
    } else if (activeData.type === "assignment" && activeData.assignmentId) {
      const id = activeData.assignmentId;
      store.optimisticMove(id, overData.memberId, dropDate.toISOString());
      startTransition(async () => {
        const result = await moveAssignment(id, projectId, overData.memberId, dropDate.toISOString());
        if (result && "error" in result) alert(result.error);
        refresh();
      });
    }
  }

  const buildUserTimeOffSet = useCallback((userId: string): Set<string> => {
    const storeState = useGanttStore.getState();
    const set = new Set<string>();
    for (const tOff of storeState.timeOffs) {
      if (tOff.userId === userId) set.add(toDateKey(new Date(tOff.date)));
    }
    return set;
  }, []);

  const handleToggleTimeOff = useCallback((userId: string, date: Date) => {
    startTransition(async () => {
      const result = await toggleTimeOff(projectId, userId, date.toISOString());
      if (result && "error" in result) alert(result.error);
      refresh();
    });
  }, [projectId, refresh, startTransition]);

  const handleResizeStart = useCallback(
    (assignmentId: string, edge: "left" | "right", e: React.PointerEvent) => {
      const freshStore = useGanttStore.getState();
      const assignment = freshStore.assignments.find((a) => a.id === assignmentId);
      if (!assignment) return;
      const userTimeOffs = buildUserTimeOffSet(assignment.userId);
      const origStart = new Date(assignment.startDate);
      const origCalSpan = workingDaysToCalendarSpan(origStart, assignment.durationDays, userTimeOffs);
      const origEndDate = addDays(origStart, origCalSpan - 1);
      freshStore.setDragging(true);

      resizeRef.current = { assignmentId, edge, startX: e.clientX, origDuration: assignment.durationDays, origStartDate: assignment.startDate, origCalSpan, origEndDate: origEndDate.toISOString() };

      const onPointerMove = (ev: PointerEvent) => {
        if (!resizeRef.current) return;
        const deltaX = ev.clientX - resizeRef.current.startX;
        const deltaCols = Math.round(deltaX / COLUMN_WIDTH);
        const currentAssignment = useGanttStore.getState().assignments.find((a) => a.id === resizeRef.current!.assignmentId);
        const timeOffs = currentAssignment ? buildUserTimeOffSet(currentAssignment.userId) : undefined;
        if (resizeRef.current.edge === "right") {
          const newCalSpan = Math.max(1, resizeRef.current.origCalSpan + deltaCols);
          const rStart = new Date(resizeRef.current.origStartDate);
          const newEnd = addDays(rStart, newCalSpan - 1);
          const newWorkDays = countWorkingDays(rStart, newEnd, timeOffs);
          useGanttStore.getState().optimisticResize(resizeRef.current.assignmentId, newWorkDays);
        } else {
          const rOrigStart = new Date(resizeRef.current.origStartDate);
          const rOrigEnd = new Date(resizeRef.current.origEndDate);
          const newStart = addDays(rOrigStart, deltaCols);
          if (newStart > rOrigEnd) return;
          const newWorkDays = countWorkingDays(newStart, rOrigEnd, timeOffs);
          useGanttStore.getState().optimisticResize(resizeRef.current.assignmentId, Math.max(1, newWorkDays), newStart.toISOString());
        }
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        if (!resizeRef.current) { useGanttStore.getState().setDragging(false); return; }
        const currentState = useGanttStore.getState();
        const a = currentState.assignments.find((x) => x.id === resizeRef.current!.assignmentId);
        if (!a) { currentState.setDragging(false); return; }
        const savedId = resizeRef.current.assignmentId;
        const savedEdge = resizeRef.current.edge;
        const savedDuration = a.durationDays;
        const savedStart = savedEdge === "left" ? a.startDate : undefined;
        resizeRef.current = null;
        startTransition(async () => {
          const result = await resizeAssignmentAction(savedId, projectId, savedDuration, savedStart);
          if (result && "error" in result) alert(result.error);
          refresh();
          useGanttStore.getState().setDragging(false);
        });
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [projectId, refresh, startTransition],
  );

  const handleBlockContextMenu = useCallback((assignmentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, assignmentId });
  }, []);

  const handleDeleteBlock = useCallback((assignmentId: string) => {
    setContextMenu(null);
    store.optimisticRemove(assignmentId);
    startTransition(async () => {
      const result = await deleteAssignment(assignmentId, projectId);
      if (result && "error" in result) alert(result.error);
      refresh();
    });
  }, [store, projectId, refresh, startTransition]);

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-zinc-400">{tc("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (state.sprints.length === 0) {
    return <GanttEmptyState projectId={projectId} isSM={isSM} onCreated={refresh} />;
  }

  const lastSprint = state.sprints[state.sprints.length - 1];

  function handleAddSprint() {
    startTransition(async () => { await createSprint(projectId); refresh(); });
  }

  function handleDeleteLast() {
    if (!lastSprint) return;
    startTransition(async () => {
      const result = await deleteSprint(lastSprint.id, projectId);
      if (result && "error" in result) alert(result.error);
      refresh();
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 flex-col overflow-hidden">
        {isSM && (
          <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            <button onClick={handleAddSprint} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {t("addSprint")}
            </button>
            <button onClick={handleDeleteLast} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
              {t("deleteLast")}
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <GanttTimeline sprints={state.sprints} members={state.members} assignments={store.assignments} timeOffs={state.timeOffs ?? []} projectId={projectId} isSM={isSM} activeSprintId={state.activeSprintId} onResizeStart={isSM ? handleResizeStart : undefined} onContextMenu={isSM ? handleBlockContextMenu : undefined} onDelete={isSM ? handleDeleteBlock : undefined} onToggleTimeOff={isSM ? handleToggleTimeOff : undefined} onRefresh={refresh} />
          {isSM && <GanttBacklog tickets={state.backlog} />}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        <div className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 shadow-lg dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {t("dragHint")}
        </div>
      </DragOverlay>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setContextMenu(null)} />
          <div className="fixed z-[70] min-w-[140px] rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button onClick={() => handleDeleteBlock(contextMenu.assignmentId)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
              {tc("delete")}
            </button>
          </div>
        </>
      )}
    </DndContext>
  );
}
