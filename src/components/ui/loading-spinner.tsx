"use client";

/**
 * Canonical loading indicators.
 *
 * - `Spinner` — small inline icon (e.g. inside buttons, sidebars)
 * - `LoadingScreen` — full-page centered indicator with optional label
 *                      (used when a server-fetched state isn't ready yet)
 */

export type SpinnerSize = "sm" | "md" | "lg";

const SIZE: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: SpinnerSize;
}

export function Spinner({ size = "md", className, ...rest }: SpinnerProps) {
  return (
    <svg
      className={[SIZE[size], "animate-spin", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...rest}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export interface LoadingScreenProps {
  /** Visible text next to the spinner. Translate at call site. */
  label?: string;
}

export function LoadingScreen({ label }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
        <Spinner size="md" />
        {label && <span className="text-sm">{label}</span>}
      </div>
    </div>
  );
}
