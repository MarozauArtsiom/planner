"use client";

import { useState } from "react";
import { SprintCreateDialog } from "./sprint-create-dialog";

interface Props {
  projectId: string;
  isSM: boolean;
  onCreated: () => void;
}

export function GanttEmptyState({ projectId, isSM, onCreated }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        {showPicker ? (
          <SprintCreateDialog
            projectId={projectId}
            onCreated={() => {
              setShowPicker(false);
              onCreated();
            }}
            onCancel={() => setShowPicker(false)}
          />
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg
                className="h-7 w-7 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Таймлайн пуст
            </h2>
            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
              {isSM
                ? "Создайте первый спринт, чтобы начать планирование."
                : "Scrum Master ещё не создал спринты. Они появятся здесь автоматически."}
            </p>
            {isSM && (
              <button
                onClick={() => setShowPicker(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <svg
                  className="h-4 w-4"
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
                Создать первый спринт
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
