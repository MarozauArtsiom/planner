"use client";

import { useState, useEffect, useCallback } from "react";

function getStorageKey(projectId: string) {
  return `sm-mode-${projectId}`;
}

export function useSmMode(projectId: string, hasSmRights: boolean) {
  const [smMode, setSmMode] = useState(false);

  useEffect(() => {
    if (!hasSmRights) return;
    const stored = localStorage.getItem(getStorageKey(projectId));
    if (stored === "true") setSmMode(true);
  }, [projectId, hasSmRights]);

  const toggle = useCallback(() => {
    setSmMode((prev) => {
      const next = !prev;
      localStorage.setItem(getStorageKey(projectId), String(next));
      return next;
    });
  }, [projectId]);

  return { smMode: hasSmRights && smMode, toggle };
}

export function SmModeToggle({
  smMode,
  onToggle,
}: {
  smMode: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
    >
      <span
        className={`h-2 w-2 rounded-full ${smMode ? "bg-amber-500" : "bg-indigo-500"}`}
      />
      {smMode ? "Скрам Мастер" : "Команда"}
    </button>
  );
}
