/**
 * Barrel re-exports for the project UI primitives.
 *
 * Import shape: `import { Button, Card, Input } from "@/components/ui";`
 *
 * Keep this file *narrow*: every export here is meant to be reused across
 * multiple pages / features. Single-use components live next to their consumer.
 */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./button";
export {
  IconButton,
  type IconButtonProps,
  type IconButtonVariant,
  type IconButtonSize,
} from "./icon-button";
export { Card, SectionHeader, type CardProps, type CardVariant } from "./card";
export { Badge, type BadgeProps, type BadgeTone, type BadgeSize } from "./badge";
export {
  Field,
  Input,
  Textarea,
  Checkbox,
  type FieldProps,
  type InputProps,
  type TextareaProps,
  type CheckboxProps,
  type InputSize,
} from "./field";
export {
  PageShell,
  PageHeader,
  type PageShellProps,
  type PageShellVariant,
  type PageHeaderProps,
} from "./page-shell";
export {
  Spinner,
  LoadingScreen,
  type SpinnerProps,
  type SpinnerSize,
  type LoadingScreenProps,
} from "./loading-spinner";
