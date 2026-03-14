"use client";

import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { GanttBoard } from "@/components/gantt/gantt-board";
import { EstimationToast } from "@/components/estimation-toast";

const ROLE_LABELS: Record<string, string> = {
  DEV: "Developer",
  QA: "QA Engineer",
};

const ROLE_STYLES: Record<string, string> = {
  DEV: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  QA: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

interface Props {
  projectId: string;
  projectName: string;
  userName: string;
  userRole: string | null;
  hasSmRights: boolean;
  userIsSm: boolean;
}

export function ProjectContent({
  projectId,
  projectName,
  userName,
  userRole,
  hasSmRights,
  userIsSm,
}: Props) {
  const effectiveSM = hasSmRights;

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex-shrink-0 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {projectName}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {userName}
              </span>
              {userRole && (
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[userRole] ?? ""}`}
                >
                  {ROLE_LABELS[userRole] ?? userRole}
                </span>
              )}
              {(userIsSm || hasSmRights) && (
                <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  SM
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-700">
              <Link
                href={`/project/${projectId}/estimation`}
                className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Оценка
              </Link>
              {hasSmRights && (
                <Link
                  href={`/project/${projectId}/settings`}
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Настройки
                </Link>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                >
                  Выйти
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <GanttBoard projectId={projectId} isSM={effectiveSM} />
      </main>

      <EstimationToast projectId={projectId} />
    </div>
  );
}
