"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRetroNotification } from "@/hooks/use-retro-notification";

export function RetroToast({ projectId }: { projectId: string }) {
  const t = useTranslations("retro");
  const { active, boardTitle, inviteToken } = useRetroNotification(projectId);
  const [dismissed, setDismissed] = useState(false);
  const prevTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (inviteToken && inviteToken !== prevTokenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false);
    }
    prevTokenRef.current = inviteToken;
  }, [inviteToken]);

  if (!active || !inviteToken || dismissed) return null;

  return (
    <div className="fixed left-4 bottom-4 z-50 w-80 animate-[slideUp_0.3s_ease-out] rounded-xl border border-emerald-200 bg-white p-4 shadow-2xl dark:border-emerald-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
            {t("toastActiveTitle")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Close"
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
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {boardTitle && (
        <p className="mb-3 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {boardTitle}
        </p>
      )}

      <Link
        href={`/retro/${inviteToken}`}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {t("toastJoinButton")}
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
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  );
}
