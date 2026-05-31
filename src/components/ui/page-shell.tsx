import * as React from "react";
import { Footer } from "@/components/footer";

/**
 * PageShell — single source of truth for full-page layout.
 *
 * Variants:
 * - `public` — landing, /poker, /login, /register, /terms, etc. Renders <Footer />
 *              with legal links at the bottom.
 * - `app`    — internal app screens (Gantt, Estimation, Project Settings,
 *              user Settings). NO footer — would clutter dense UIs.
 *
 * Layout invariants:
 * - `min-h-screen` always (not `h-screen` — content can overflow)
 * - `bg-zinc-50` light / `bg-zinc-950` dark
 * - Flex column with `flex-1` main, so footer (when present) sticks to bottom
 *
 * Headers are passed via `header` prop OR omitted (some pages use their own).
 * Content is constrained inside — `mainConstrained` defaults to false; set true
 * to wrap children in `max-w-5xl mx-auto px-4` (for landings, settings).
 */
export type PageShellVariant = "public" | "app";

export interface PageShellProps {
  variant: PageShellVariant;
  /** Optional header rendered above main. Pass a sticky-styled element if needed. */
  header?: React.ReactNode;
  /** Optional centered/constrained main wrapper. Default false — children own their max-width. */
  mainConstrained?: boolean;
  /** Override the default `<Footer />` (e.g. minimal variant). Public-only. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Extra classes for the outermost wrapper. */
  className?: string;
}

export function PageShell({
  variant,
  header,
  mainConstrained = false,
  footer,
  children,
  className,
}: PageShellProps) {
  const renderedFooter =
    variant === "public" ? (footer ?? <Footer />) : null;

  return (
    <div
      className={[
        "flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {header}
      <main className="flex flex-1 flex-col">
        {mainConstrained ? (
          <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            {children}
          </div>
        ) : (
          children
        )}
      </main>
      {renderedFooter}
    </div>
  );
}

/**
 * PageHeader — companion to PageShell. Standard sticky header for app/public pages.
 *
 * Slots:
 * - `leading`  — left side (back button, logo, code, …)
 * - `title`    — center text (optional; many pages put title in leading)
 * - `trailing` — right side (user menu, primary action, settings link, …)
 *
 * The header itself doesn't enforce sticky positioning — wrap in
 * <PageHeader sticky /> if you want it pinned.
 */
export interface PageHeaderProps {
  leading?: React.ReactNode;
  title?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Stick to top on scroll. */
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  leading,
  title,
  trailing,
  sticky,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={[
        "border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        sticky ? "sticky top-0 z-30 backdrop-blur-lg bg-white/80 dark:bg-zinc-950/80" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <div className="flex min-w-0 items-center gap-3">{leading}</div>
        {title && (
          <div className="flex-1 truncate text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </div>
        )}
        <div className="flex flex-shrink-0 items-center gap-2 md:gap-3">
          {trailing}
        </div>
      </div>
    </header>
  );
}
