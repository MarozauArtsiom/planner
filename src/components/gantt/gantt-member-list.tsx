"use client";

import type { BoardMember } from "@/hooks/use-board-polling";

export const ROW_HEIGHT = 48;
export const MEMBER_COL_WIDTH = 160;

interface Props {
  members: BoardMember[];
  headerHeight: number;
  rowHeights?: Map<string, number>;
}

export function GanttMemberList({ members, headerHeight, rowHeights }: Props) {
  const devs = members.filter((m) => m.role === "DEV");
  const qas = members.filter((m) => m.role === "QA");

  function getHeight(memberId: string): number {
    return rowHeights?.get(memberId) ?? ROW_HEIGHT;
  }

  return (
    <div
      className="sticky left-0 z-20 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
      style={{ width: MEMBER_COL_WIDTH }}
    >
      <div
        className="sticky top-0 z-30 border-b border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-950"
        style={{ height: headerHeight }}
      >
        <div className="flex h-8 items-center justify-center border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Команда
          </span>
        </div>
        <div className="h-7" />
      </div>

      {devs.length > 0 && (
        <>
          <div className="flex h-7 items-center border-b border-zinc-200 bg-indigo-50/50 px-3 dark:border-zinc-700 dark:bg-indigo-950/20">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              Dev
            </span>
          </div>
          {devs.map((m) => (
            <div
              key={m.id}
              className="flex items-start border-b border-zinc-100 px-3 pt-3.5 dark:border-zinc-800"
              style={{ height: getHeight(m.id) }}
            >
              <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                {m.name}
              </span>
            </div>
          ))}
        </>
      )}

      {qas.length > 0 && (
        <>
          <div className="flex h-7 items-center border-b border-zinc-200 bg-emerald-50/50 px-3 dark:border-zinc-700 dark:bg-emerald-950/20">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
              QA
            </span>
          </div>
          {qas.map((m) => (
            <div
              key={m.id}
              className="flex items-start border-b border-zinc-100 px-3 pt-3.5 dark:border-zinc-800"
              style={{ height: getHeight(m.id) }}
            >
              <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                {m.name}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
