# UI Patterns — Reusable Snippets

Compiled from existing components. Match these styles when adding new UI.

## Page Shell (public page with Footer)

```tsx
import { Footer } from "@/components/footer";

return (
  <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      {/* content */}
    </div>
    <Footer />
  </div>
);
```

## Page Shell (app page, no Footer)

```tsx
return (
  <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
    <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
      {/* nav */}
    </header>
    <main className="flex-1 overflow-y-auto">
      {/* content */}
    </main>
  </div>
);
```

## Card

```tsx
<div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
    {t("title")}
  </h3>
  {/* body */}
</div>
```

## Primary Button

```tsx
<button
  type="button"
  disabled={isPending}
  onClick={handleClick}
  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
>
  {isPending ? t("processing") : t("submit")}
</button>
```

## Secondary Button

```tsx
<button
  type="button"
  className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
>
  {t("cancel")}
</button>
```

## Icon Button

```tsx
<button
  type="button"
  title={t("tooltip")}
  className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
>
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="..." />
  </svg>
</button>
```

## Input

```tsx
<label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
  {t("name")}
</label>
<input
  id="name"
  name="name"
  type="text"
  required
  placeholder={t("placeholder")}
  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-blue-400"
/>
```

## Checkbox (consent style)

```tsx
<label className="flex cursor-pointer items-start gap-2 select-none">
  <input
    type="checkbox"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
    required
    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
  />
  <span className="text-xs text-zinc-600 dark:text-zinc-400">
    {tl("registerAgreement", { age: MIN_AGE })}{" "}
    <Link href="/terms" target="_blank" className="text-blue-600 underline">{tl("terms")}</Link>
  </span>
</label>
```

## Badge

```tsx
<span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
  {t("label")}
</span>
```

| Tone | Background + Text |
|---|---|
| Neutral | `bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300` |
| Info | `bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300` |
| Success | `bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300` |
| Warning | `bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300` |
| Danger | `bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300` |
| Accent (BA) | `bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300` |

## Error Banner

```tsx
{error && (
  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
    {error}
  </p>
)}
```

## Success Toast (transient)

```tsx
{toast && (
  <div className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2">
    <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-lg dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-200">
      {t("toastMessage")}
    </div>
  </div>
)}
```

Auto-dismiss via `setTimeout` + `useEffect`.

## Empty State

```tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
    <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="..." />
    </svg>
  </div>
  <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{t("emptyTitle")}</h2>
  <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{t("emptyDesc")}</p>
  {/* CTA — what user can do */}
</div>
```

## Modal (overlay)

```tsx
{open && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 px-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
      onClick={(e) => e.stopPropagation()}
    >
      {/* content */}
    </div>
  </div>
)}
```

## Progress Bar

```tsx
<div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
  <div
    className="h-full rounded-full bg-blue-500 transition-all"
    style={{ width: `${(value / max) * 100}%` }}
  />
</div>
```

## Form Submit Pattern (useTransition)

```tsx
const [isPending, startTransition] = useTransition();
const [error, setError] = useState<string | null>(null);

const handleSubmit = () => {
  startTransition(async () => {
    const fd = new FormData();
    fd.set("key", value);
    const result = await someAction(fd);
    if (result && "error" in result) setError(result.error ?? t("errorFallback"));
    else onSuccess?.();
  });
};
```

## Role Colors (Project Convention)

| Role | Color scale |
|---|---|
| Dev | `indigo-*` |
| QA | `emerald-*` |
| BA | `amber-*` |
| Owner / Host | `blue-*` |
| Risk | `amber-*` |
| Uncertainty | `violet-*` |

Stay consistent across new components.
