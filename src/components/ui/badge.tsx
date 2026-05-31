import * as React from "react";

/**
 * Project-canonical Badge.
 *
 * Tones map to project semantics (see `skills/frontend-dev/references/ui-patterns.md`):
 * - `neutral`  — labels (e.g. counts)
 * - `info`     — informational ("Host", "Active sprint")
 * - `success`  — positive states ("Estimated", "Voted")
 * - `warning`  — caution ("Risk: high", "Expiring soon")
 * - `danger`   — destructive / error states
 * - `accent`   — BA / special highlights
 * - `role-dev` / `role-qa` / `role-ba` — project role colours
 */
export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "role-dev"
  | "role-qa"
  | "role-ba";

export type BadgeSize = "xs" | "sm" | "md";

const BASE = "inline-flex items-center gap-1 rounded-full font-semibold";

const TONE: Record<BadgeTone, string> = {
  neutral:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  info:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  danger:
    "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  accent:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  "role-dev":
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  "role-qa":
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  "role-ba":
    "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

const SIZE: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[10px]",
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
}

export function Badge({
  tone = "neutral",
  size = "xs",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[BASE, TONE[tone], SIZE[size], className ?? ""]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}
