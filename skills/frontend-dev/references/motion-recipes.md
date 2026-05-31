# Motion Recipes — CSS Only

This project uses **CSS animations only** — no Framer Motion, no GSAP, no Lottie. Below are recipes used in the codebase.

## Existing global keyframes

Defined in `src/app/globals.css` (search for `@keyframes`):

- `landing-fade-in` — opacity 0→1 + translate-y(20px)→0, 0.6s ease-out
- `landing-delay-1`, `landing-delay-2`, `landing-delay-3` — wrappers for staggered delays
- `landing-hero-glow` — radial gradient pulse for hero

Reuse these classes by adding them to elements. Don't define ad-hoc duplicates.

## Reveal on Mount (Fade + Slide-Up)

Add `landing-fade-in` class. For staggered elements in a list, use `landing-delay-{1,2,3,...}`.

```tsx
<div className="landing-fade-in">{/* shows immediately */}</div>
<div className="landing-fade-in landing-delay-1">{/* +100ms */}</div>
<div className="landing-fade-in landing-delay-2">{/* +200ms */}</div>
```

## Hover Lift (Card)

```tsx
<div className="rounded-2xl border bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-0.5">
  ...
</div>
```

## Hover Slide-Arrow (CTA)

```tsx
<div className="group inline-flex items-center gap-1.5 ...">
  {t("action")}
  <span className="transition-transform group-hover:translate-x-1">→</span>
</div>
```

## Spinner

Tailwind built-in:

```tsx
<svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
</svg>
```

## Pulse (Live Indicator)

```tsx
<div className="flex items-center gap-2">
  <span className="relative flex h-2.5 w-2.5">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
  </span>
  {t("live")}
</div>
```

## Skeleton Loader

```tsx
<div className="animate-pulse">
  <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
  <div className="mt-2 h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
</div>
```

## Transient Toast (auto-dismiss)

```tsx
const [toast, setToast] = useState<string | null>(null);
useEffect(() => {
  if (!toast) return;
  const tid = setTimeout(() => setToast(null), 3500);
  return () => clearTimeout(tid);
}, [toast]);

return (
  <>
    {toast && (
      <div className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2">
        <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-lg dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-200">
          {toast}
        </div>
      </div>
    )}
  </>
);
```

Used in `quick-room-board.tsx` for "method changed" notification.

## React Key Reset (clear local state on prop change)

Not strictly motion, but a key technique: when polled config changes (e.g. estimation method), re-mount the form via `key` to flush local `selected` state.

```tsx
<VotingForm key={state.estimationConfig.method} ... />
```

## Performance Guardrails

- **Animate only `transform`, `opacity`, `filter`** — these are GPU-cheap.
- **Never animate** `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` — they trigger layout.
- For continuous "live" animations (pulse, ping), keep them in **leaf components** so React doesn't re-render the whole subtree.
- Wrap heavy decorative motion in `@media (prefers-reduced-motion: no-preference) { ... }`.

## Accessibility

- Visible focus rings via `focus:ring-2 focus:ring-blue-500/20` — never `outline-none` without a replacement.
- For dynamically revealed content, add `aria-live="polite"` to the container.
- Auto-playing animations need a way to stop or respect `prefers-reduced-motion`.

## What We Don't Do

- 3D / WebGL / Three.js
- Scroll-linked animations (`animation-timeline: scroll()` — too new, mixed browser support)
- Page transitions (Next.js App Router doesn't have a stable API; vanilla navigation is fine)
- Long cinematic sequences — the product is utilitarian
