"use client";

import * as React from "react";

/**
 * Project-canonical button.
 *
 * Variants encode INTENT (not just colour) — pick by what the action means:
 * - `primary`  — the main action of the screen / section
 * - `secondary` — alternative path, less weight
 * - `ghost`    — discoverable but visually quiet (rows, lists, dense UI)
 * - `danger`   — destructive (delete, kick, leave)
 *
 * Sizes mirror existing usage:
 * - `sm` — inline chips, sidebar actions (text-xs)
 * - `md` — default for forms and modals (text-sm)
 * - `lg` — hero / single-CTA pages (text-base)
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-colors focus:ring-2 focus:ring-blue-500/20 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
  secondary:
    "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 " +
    "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
  danger:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full-width — used for primary submits on mobile / single-CTA pages. */
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      block,
      className,
      type = "button",
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={[
          BASE,
          VARIANT[variant],
          SIZE[size],
          block ? "w-full" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
