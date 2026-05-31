---
name: frontend-dev
description: |
  Frontend development guide adapted to this project's exact stack: Next.js 16 (App Router) +
  React 19 + TypeScript + Tailwind CSS 4 + next-intl (7 languages) + Prisma client types.
  TRIGGER when: building pages, components, forms, layouts, animations, accessibility,
  adding i18n keys, working with Server/Client Components, integrating Server Actions with UI,
  writing motion/transitions, building landing-style sections, redesigning existing screens.
  DO NOT TRIGGER for: backend-only work (Prisma schema, API routes, auth) — use `backend-dev`.
license: MIT
metadata:
  category: frontend
  version: "1.0.0"
  stack:
    - Next.js 16.1.6 (App Router, Turbopack)
    - React 19.2.3
    - TypeScript 5
    - Tailwind CSS 4
    - next-intl 4 (i18n, 7 languages)
    - @dnd-kit (drag-drop)
    - zustand (client state)
    - jspdf + jspdf-autotable (PDF generation)
    - papaparse (CSV parsing)
  sources:
    - Adapted from MiniMax/skills frontend-dev
    - Adjusted to the Planning Poker codebase conventions
---

# Frontend Skill — Planning Poker

This skill encodes the conventions that already exist in this codebase. **Match the existing patterns before introducing new ones.** Run `git grep` if you're not sure how something is done elsewhere.

---

## 1. Project Layout

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root: NextIntlClientProvider + CookieBanner + metadata
│   ├── page.tsx                  # Home: landing for guests, dashboard for authed
│   ├── globals.css               # Tailwind directives + landing animations
│   ├── proxy.ts                  # Auth middleware (PUBLIC_PATHS allowlist)
│   ├── actions/                  # Server Actions ("use server")
│   │   ├── auth.ts
│   │   ├── estimation.ts
│   │   ├── project.ts
│   │   ├── quick-room.ts
│   │   └── ...
│   ├── api/                      # GET API routes (polling, stats)
│   │   ├── estimation/
│   │   │   ├── session/route.ts
│   │   │   └── ticket-stats/route.ts
│   │   ├── project/[id]/
│   │   ├── cron/cleanup-expired/route.ts
│   │   └── ...
│   ├── poker/                    # Quick Rooms feature
│   │   ├── page.tsx              # Landing for /poker
│   │   ├── poker-landing-form.tsx
│   │   └── [code]/
│   │       ├── page.tsx          # Server component (resolve code → project)
│   │       ├── quick-room-board.tsx
│   │       └── quick-room-join-form.tsx
│   ├── project/[id]/...
│   ├── terms/page.tsx            # Legal pages
│   ├── privacy/page.tsx
│   ├── cookies/page.tsx
│   ├── not-found.tsx             # Custom 404
│   ├── error.tsx                 # Global error boundary
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── invite/[token]/page.tsx
│   └── settings/page.tsx
├── components/                   # Reusable UI building blocks
│   ├── footer.tsx                # Global legal footer
│   ├── cookie-banner.tsx
│   ├── landing-page.tsx
│   ├── user-menu.tsx
│   ├── estimation/
│   │   ├── voting-form.tsx
│   │   ├── voting-results.tsx
│   │   ├── vote-details.tsx
│   │   ├── vote-distribution-chart.tsx
│   │   ├── ticket-form.tsx
│   │   ├── ticket-import-modal.tsx
│   │   └── estimation-board.tsx
│   ├── gantt/...
│   └── quick-room/
│       └── qr-code-modal.tsx
├── hooks/                        # Custom React hooks (polling)
│   ├── use-estimation-polling.ts
│   ├── use-board-polling.ts
│   └── use-estimation-notification.ts
├── lib/                          # Pure utilities (no React)
│   ├── db.ts                     # Prisma client (Turso adapter in prod)
│   ├── session.ts                # httpOnly cookie session
│   ├── current-user.ts
│   ├── password.ts               # bcrypt wrapper
│   ├── legal.ts                  # APP_NAME, CONTROLLER_NAME, etc.
│   ├── estimation-engine.ts      # Composite + Simple methods + IQR
│   ├── quick-room.ts             # Code gen + TTL helpers
│   ├── date-utils.ts
│   ├── sp-scale.ts
│   ├── permissions.ts
│   ├── csv-parser.ts
│   └── report/...
├── stores/                       # Zustand stores (client state)
├── i18n/
│   └── request.ts                # next-intl config (cookie-based locale)
└── generated/prisma/             # Prisma client output (auto-generated)
messages/                         # i18n JSON files (7 languages)
├── ru.json
├── en.json
├── pl.json
├── es.json
├── be.json
├── uk.json
└── hi.json
```

**Rules:**
- Server Components by default. Add `"use client"` only on leaves that need interactivity (state, effects, browser APIs).
- File names: `kebab-case.tsx` (matches existing).
- Component exports: `PascalCase`. One main component per file, helpers below it.

---

## 2. Server / Client Component Split

| Where it belongs | Pattern |
|---|---|
| **Server Component** (default) | Pages doing DB reads (`prisma.x.findUnique`), `await getSession()`, `await getTranslations()`, server-only actions binding |
| **Client Component** (`"use client"`) | Anything with `useState`, `useEffect`, `useTransition`, event handlers, polling hooks, refs |
| **Mixed page** | Server `page.tsx` does data fetching → passes JSON to a client child via props |

**Example existing pattern** (`src/app/poker/[code]/page.tsx`):

```tsx
// Server component
export default async function QuickRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = await prisma.project.findUnique({ where: { accessCode: code.toUpperCase() } });
  if (!room || !room.isQuick) notFound();
  if (isQuickRoomExpired(room.expiresAt)) redirect("/poker?error=expired");

  // Pass server-fetched data to client component
  return <QuickRoomBoard projectId={room.id} accessCode={code.toUpperCase()} />;
}
```

```tsx
// Client child
"use client";
export function QuickRoomBoard({ projectId, accessCode }: Props) {
  const { state, refresh } = useEstimationPolling(projectId, 5000);
  // ...
}
```

**Rule:** Server components await `await params` (Next.js 16 — params is a Promise).

---

## 3. Forms + Server Actions

Forms always invoke a Server Action from `src/app/actions/*.ts`. Two patterns:

### Pattern A: `useActionState` (login, register, simple flows)

```tsx
"use client";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";

const [state, formAction, isPending] = useActionState<{ error?: string } | undefined, FormData>(
  async (_prev, formData) => {
    formData.set("redirectTo", redirectTo);
    return await register(formData);
  },
  undefined,
);

return <form action={formAction}>...</form>;
```

### Pattern B: `useTransition` + manual call (most forms in this project)

```tsx
"use client";
import { useTransition, useState } from "react";
import { submitVote } from "@/app/actions/estimation";

const [isPending, startTransition] = useTransition();
const [error, setError] = useState<string | null>(null);

const handleSubmit = () => {
  startTransition(async () => {
    const formData = new FormData();
    formData.set("singleValue", String(selected));
    const result = await submitVote(projectId, formData);
    if (result && "error" in result) setError(result.error ?? t("errorFallback"));
    else onSuccess();
  });
};
```

**Rule:** Server actions return `{ success: true, ... } | { error: string }` or call `redirect()`. Never throw — handle errors as values.

---

## 4. Real-time via Polling Hooks

This project uses **HTTP polling at 5-second intervals**, not WebSocket/SSE. The canonical hook:

```ts
// src/hooks/use-estimation-polling.ts
export function useEstimationPolling(projectId: string, intervalMs = 5000) {
  // fetches /api/estimation/session?projectId=...
  // returns { state, error, refresh }
}
```

**Patterns derived from this:**
- Optimistic updates: change local state immediately + call action + `refresh()` in `startTransition`
- Toast on data change: compare previous polled value via `useRef`, show transient toast (see `quick-room-board.tsx` method change toast)
- `key={method}` on inputs to reset local state when polled config changes

---

## 4.5. Shared UI primitives (USE THESE)

**As of Epic 11 Phase 1 (2026-06)**, the project ships a small library of shared components at `src/components/ui/`. **Always check there first** before writing inline `<button className="...">` or rolling your own Card. The library covers:

- `Button`, `IconButton` — variants + sizes encoded
- `Card`, `SectionHeader` — surface + uppercase title
- `Badge` — tones including project role colours (`role-dev`, `role-qa`, `role-ba`)
- `Field`, `Input`, `Textarea`, `Checkbox` — form primitives with label+error wrapper
- `PageShell`, `PageHeader` — full-page layout with optional Footer
- `Spinner`, `LoadingScreen` — loading indicators

Import via the barrel:

```tsx
import { Button, Card, Input, PageShell } from "@/components/ui";
```

Reach for raw Tailwind only when the primitive doesn't fit. See `references/ui-patterns.md` for the complete API table + fallback snippets.

## 5. Tailwind CSS 4 Conventions

The project uses **Tailwind 4** (`@tailwindcss/postcss`). Existing conventions:

| Pattern | Style |
|---|---|
| Background | `bg-zinc-50 dark:bg-zinc-950` (page), `bg-white dark:bg-zinc-900` (cards) |
| Borders | `border border-zinc-200 dark:border-zinc-800` |
| Primary action | `bg-blue-600 hover:bg-blue-700 dark:bg-blue-500` |
| Secondary action | `border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800` |
| Danger | `text-red-600 dark:text-red-400` (not `bg-red-*` for buttons unless destructive confirm) |
| Card | `rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900` |
| Disabled | `disabled:cursor-not-allowed disabled:opacity-50` |
| Text scale | `text-3xl md:text-5xl lg:text-6xl` for hero, `text-2xl` for section titles, `text-sm` for body, `text-xs` for meta |
| Focus | `focus:ring-2 focus:ring-blue-500/20 focus:outline-none` |
| Color scale | Use `zinc` for greys (never `gray` or `slate`) — for project consistency |
| Accent palette | `blue-*` primary, `emerald-*` success/QA, `amber-*` risk/warning, `violet-*` uncertainty/BA, `indigo-*` Dev role |

**Dark mode:** Every color class must have a `dark:` counterpart. No exceptions.

**Forbidden in this codebase:**
- Emojis in UI (we use inline SVG icons instead)
- `gray-*` color scale (use `zinc-*`)
- `h-screen` (use `min-h-screen` or `min-h-[100dvh]`)
- Centered single-column layouts when the section has > 3 fields — split into card with `space-y-*`

---

## 6. Icons

We don't use icon libraries. **Inline SVG** via React components, following the existing project pattern:

```tsx
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
```

Source: Heroicons paths (outline). Don't import `@heroicons/react`. Don't use emojis. Keep icons small and consistent — `h-4 w-4` or `h-5 w-5`.

---

## 7. i18n (next-intl) — MANDATORY for any new UI text

**No hard-coded strings in components. Always go through `useTranslations` / `getTranslations`.**

### Client components

```tsx
"use client";
import { useTranslations } from "next-intl";

const t = useTranslations("estimation");
return <button>{t("revealResults")}</button>;
```

### Server components

```tsx
import { getTranslations } from "next-intl/server";

const t = await getTranslations("estimation");
return <h1>{t("sessionTitle")}</h1>;
```

### Adding a new key (the project rule)

Every new UI string MUST appear in **all 7 files** in `messages/`:

```
messages/ru.json  ru.json
messages/en.json
messages/pl.json
messages/es.json
messages/be.json
messages/uk.json
messages/hi.json
```

Validation: `for f in messages/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f', 'utf8'))"; done`

**Pluralization:** Use ICU MessageFormat. Russian/Belarusian/Ukrainian have multiple plural forms — verify with the existing `weekLabel`/`memberCount` patterns in `messages/ru.json`.

**Interpolation:** `{name}`, `{count}` — never string-concatenate.

---

## 8. Loading / Empty / Error States

Every screen that fetches data must implement four states. Existing pattern from `estimation-board.tsx`:

```tsx
if (!state) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-sm text-zinc-400">{tc("loading")}</span>
    </div>
  );
}

if (state.tickets.length === 0) {
  return <EmptyState ... />;
}

// error: per-form, inline red box
{error && (
  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
    {error}
  </p>
)}
```

**Rules:**
- Empty states must include a CTA (what the user can do)
- Errors must be human-readable (translated via i18n, not raw exception text)
- Disabled buttons during pending — `disabled:opacity-50 disabled:cursor-not-allowed`

---

## 9. Animations

We use **only CSS** — no Framer Motion, no GSAP, no Lottie. Existing animations are in `globals.css` (`landing-fade-in`, `landing-delay-*`, `landing-hero-glow`).

| Need | How |
|---|---|
| Fade-in on mount | CSS keyframe in `globals.css`, class on element |
| Hover scale | `hover:scale-[1.02] transition-transform` |
| Spinner | `animate-spin` (Tailwind built-in) |
| Pulse | `animate-pulse` (Tailwind built-in) |
| Slide-in | `transition-transform translate-x-* group-hover:translate-x-1` |
| Toast fade-out | `setTimeout` + opacity transition |

**Rule:** Animate only `transform`, `opacity`, `filter` (GPU-cheap). Never animate `width`, `height`, `top`, `left`, `margin`.

**Accessibility:** wrap meaningful motion in `@media (prefers-reduced-motion: no-preference) { ... }` in CSS.

---

## 10. Legal & Consent UX

When adding ANY new entry point that creates a user account or a guest user:

1. Add a click-wrap checkbox referencing Terms + Privacy (see `register/page.tsx` for the pattern)
2. Or add a browse-wrap inline text (see `poker-landing-form.tsx`):

```tsx
<p className="text-center text-[11px] text-zinc-400">
  {t("agreementInline", { age: MIN_AGE })}{" "}
  <Link href="/terms" target="_blank" className="underline">Terms</Link> ·{" "}
  <Link href="/privacy" target="_blank" className="underline">Privacy</Link>
</p>
```

**Source:** `src/lib/legal.ts` — read `MIN_AGE`, `APP_NAME`, etc. from there. Never hard-code.

---

## 11. Footer on Public Pages

Every **publicly-reachable** page (no auth) must end with `<Footer />`:

- `/` (landing variant)
- `/poker`, `/poker/[code]`
- `/login`, `/register`
- `/terms`, `/privacy`, `/cookies`
- `/not-found`, `/error`

Internal app pages (`/project/...`, `/settings`) typically don't use Footer — it would clutter the UI.

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

---

## 12. Quality Gates

Before finishing any frontend task:

- [ ] No new hard-coded UI strings — all go through `useTranslations` / `getTranslations`
- [ ] New keys added to **all 7** `messages/*.json` files
- [ ] JSON files validated (`node -e "JSON.parse(...)"`)
- [ ] Dark mode covered (`dark:` class for every color)
- [ ] No `gray-*` (use `zinc-*`), no `h-screen` (use `min-h-screen`), no emojis
- [ ] Loading / empty / error states for any async UI
- [ ] `"use client"` only where needed; pages stay server components when possible
- [ ] Server Actions return `{ success } | { error }` — no thrown errors leaking to UI
- [ ] Build passes: `DATABASE_URL="file:./dev.db" npm run build`
- [ ] Lint clean (no new errors): `npm run lint`

---

## 13. References

| Need | File |
|---|---|
| Project tech stack quick reference | [references/project-stack.md](references/project-stack.md) |
| Common UI building blocks (cards, badges, buttons) | [references/ui-patterns.md](references/ui-patterns.md) |
| i18n workflow + plural rules per language | [references/i18n-workflow.md](references/i18n-workflow.md) |
| Animation snippets used in the codebase | [references/motion-recipes.md](references/motion-recipes.md) |
