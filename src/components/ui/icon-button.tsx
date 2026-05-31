"use client";

import * as React from "react";

/**
 * Square icon-only button. Accessibility-mandatory `label` becomes both
 * the native tooltip (`title`) AND the `aria-label`. If you want a different
 * visible tooltip vs screen-reader text, pass `tooltip` separately.
 */
export type IconButtonVariant = "ghost" | "outline";
export type IconButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center rounded-md transition-colors " +
  "focus:ring-2 focus:ring-blue-500/20 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT: Record<IconButtonVariant, string> = {
  ghost:
    "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 " +
    "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200",
  outline:
    "border border-zinc-200 text-zinc-500 hover:bg-zinc-100 " +
    "dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800",
};

const SIZE: Record<IconButtonSize, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Accessible label — used as tooltip + aria-label. Required. */
  label: string;
  /** Optional visible tooltip if it should differ from the aria-label. */
  tooltip?: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      label,
      tooltip,
      variant = "ghost",
      size = "md",
      type = "button",
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        title={tooltip ?? label}
        aria-label={label}
        className={[BASE, VARIANT[variant], SIZE[size], className ?? ""]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
