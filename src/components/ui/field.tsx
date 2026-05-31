import * as React from "react";

/**
 * Form primitives — Field wrapper + Input + Checkbox.
 *
 * Composition pattern (matches React form conventions, controlled or uncontrolled):
 *
 * <Field label="Nickname" hint="Used only in this session" error={state?.error}>
 *   <Input name="name" required autoFocus />
 * </Field>
 *
 * Field is just a vertical stack: label → child input → optional hint OR error.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────────────────────────────────────

export interface FieldProps {
  label?: React.ReactNode;
  /** Helper text shown when there's no error. */
  hint?: React.ReactNode;
  /** Error message — when present, replaces hint and adds a red ring on focus. */
  error?: string | null;
  /** Whether to render the label as muted-and-small (default) or strong (for primary fields). */
  emphasis?: "muted" | "strong";
  children: React.ReactNode;
  className?: string;
  /** Optional id for screen-readers connecting label → input. */
  htmlFor?: string;
}

export function Field({
  label,
  hint,
  error,
  emphasis = "muted",
  children,
  className,
  htmlFor,
}: FieldProps) {
  return (
    <div className={["space-y-1.5", className ?? ""].filter(Boolean).join(" ")}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={
            emphasis === "strong"
              ? "block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              : "block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          }
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────

export type InputSize = "sm" | "md" | "lg";

const INPUT_BASE =
  "block w-full rounded-lg border bg-white text-zinc-900 placeholder-zinc-400 " +
  "transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-blue-400";

const INPUT_SIZE: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

const INPUT_BORDER_OK = "border-zinc-300 dark:border-zinc-700";
const INPUT_BORDER_ERR =
  "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:focus:border-red-400";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ size = "md", invalid, className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={[
          INPUT_BASE,
          INPUT_SIZE[size],
          invalid ? INPUT_BORDER_ERR : INPUT_BORDER_OK,
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Textarea (same visual language)
// ─────────────────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={[
          INPUT_BASE,
          "px-3 py-2 text-sm leading-relaxed",
          invalid ? INPUT_BORDER_ERR : INPUT_BORDER_OK,
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox (with inline label slot — like consent UX)
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Visible label slot to the right of the box. Can include links. */
  label: React.ReactNode;
  /** Where label sits — `top` for multi-line consent text, `center` for short labels. */
  align?: "top" | "center";
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, align = "top", className, ...rest }, ref) {
    return (
      <label
        className={[
          "flex cursor-pointer select-none gap-2",
          align === "top" ? "items-start" : "items-center",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          ref={ref}
          type="checkbox"
          className={[
            align === "top" ? "mt-0.5" : "",
            "h-4 w-4 flex-shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600",
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
      </label>
    );
  },
);
