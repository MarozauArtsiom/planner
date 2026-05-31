import * as React from "react";

/**
 * Project-canonical Card surface.
 *
 * Variants:
 * - `default` — standard `p-5`, used in 90% of places
 * - `compact` — `p-4`, for dense rows / sidebars
 * - `flush`   — no padding; you own the inner layout (used for tables, lists)
 * - `accent`  — blue border for the "primary" of two-CTA layouts (landing)
 */
export type CardVariant = "default" | "compact" | "flush" | "accent";

const BASE =
  "rounded-xl border bg-white dark:bg-zinc-900 transition-colors";

const VARIANT: Record<CardVariant, string> = {
  default: "border-zinc-200 dark:border-zinc-800 p-5",
  compact: "border-zinc-200 dark:border-zinc-800 p-4",
  flush: "border-zinc-200 dark:border-zinc-800",
  accent:
    "border-2 border-blue-500 dark:border-blue-600 " +
    "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 p-5",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({
  variant = "default",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[BASE, VARIANT[variant], className ?? ""]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * SectionHeader — the uppercase-tracked, muted title used inside Cards.
 * Optional `actions` slot for buttons aligned right.
 */
export interface SectionHeaderProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Override the bottom margin. Defaults to `mb-4`. */
  marginBottom?: string;
}

export function SectionHeader({
  children,
  actions,
  marginBottom = "mb-4",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${marginBottom}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {children}
      </h3>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
