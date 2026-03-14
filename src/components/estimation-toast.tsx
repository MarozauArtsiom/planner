"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useEstimationNotification } from "@/hooks/use-estimation-notification";

export function EstimationToast({ projectId }: { projectId: string }) {
  const { active, ticketTitle } = useEstimationNotification(projectId);
  const [dismissed, setDismissed] = useState(false);
  const prevTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (ticketTitle && ticketTitle !== prevTitleRef.current) {
      setDismissed(false);
    }
    prevTitleRef.current = ticketTitle;
  }, [ticketTitle]);

  if (!active || dismissed) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 animate-[slideUp_0.3s_ease-out] rounded-xl border border-blue-200 bg-white p-4 shadow-2xl dark:border-blue-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider dark:text-blue-400">
            Оценка началась
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {ticketTitle && (
        <p className="mb-3 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {ticketTitle}
        </p>
      )}

      <Link
        href={`/project/${projectId}/estimation`}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Перейти к оценке
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}
