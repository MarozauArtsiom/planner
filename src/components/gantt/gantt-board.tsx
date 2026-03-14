"use client";

import { useTransition } from "react";
import { useBoardPolling } from "@/hooks/use-board-polling";
import { GanttEmptyState } from "./gantt-empty-state";
import { GanttTimeline } from "./gantt-timeline";
import { createSprint, deleteSprint } from "@/app/actions/sprint";

interface Props {
  projectId: string;
  isSM: boolean;
}

export function GanttBoard({ projectId, isSM }: Props) {
  const { state, error, refresh } = useBoardPolling(projectId);
  const [isPending, startTransition] = useTransition();

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-zinc-400">Загрузка...</div>
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
    return (
      <GanttEmptyState projectId={projectId} isSM={isSM} onCreated={refresh} />
    );
  }

  const lastSprint = state.sprints[state.sprints.length - 1];

  function handleAddSprint() {
    startTransition(async () => {
      await createSprint(projectId);
      refresh();
    });
  }

  function handleDeleteLast() {
    if (!lastSprint) return;
    startTransition(async () => {
      const result = await deleteSprint(lastSprint.id, projectId);
      if (result && "error" in result) {
        alert(result.error);
      }
      refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {isSM && (
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            onClick={handleAddSprint}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Добавить спринт
          </button>
          <button
            onClick={handleDeleteLast}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            Удалить последний
          </button>
        </div>
      )}

      <GanttTimeline
        sprints={state.sprints}
        members={state.members}
        projectId={projectId}
        isSM={isSM}
      />
    </div>
  );
}
