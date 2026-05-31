# ROADMAP — Milestone: Visual Redesign

5 phases, **dependency-ordered**. Each phase ends with a clean build, manual smoke test, and a changelog entry. Phases run sequentially (each builds on the previous).

```
Phase 1 ──┬──> Phase 2 (Home) ─────┬──> Phase 4 (App)
          │                         │
          └──> Phase 3 (Public) ────┴──> Phase 5 (Polish)
```

Phase 2 and 3 can technically run in either order after Phase 1; recommendation = 2 first because the home page is the user's first impression and unlocks the biggest WoW for subsequent demos.

---

## Phase 1 — Design Foundation

**Goal:** extract design tokens + ship a small library of shared components that every later phase consumes.

**Deliverables:**
- `src/components/ui/button.tsx` — `<Button variant="primary|secondary|ghost|danger" size="sm|md|lg">`
- `src/components/ui/icon-button.tsx` — square icon-only button with built-in tooltip prop
- `src/components/ui/card.tsx` — `<Card>` with consistent border/padding/radius
- `src/components/ui/page-shell.tsx` — `<PageShell variant="public|app">` (handles min-h-screen + bg + optional Footer)
- `src/components/ui/badge.tsx` — `<Badge tone="info|success|warning|danger|neutral|accent">`
- `src/components/ui/input.tsx` + `<Field>` wrapper with label + error slot
- `src/components/ui/section-header.tsx` — uppercase-tracked title used in card sections
- `src/lib/design-tokens.ts` — single source for spacing, radii, semantic color tokens (if needed beyond Tailwind palette)
- Update `skills/frontend-dev/references/ui-patterns.md` to point at the new components

**Files touched:** ~8 new components, ~1 new lib, ~1 skill update. Zero page changes.

**Acceptance criteria:**
- All components render in isolation (build passes, no consumers required)
- Documented usage in `ui-patterns.md`
- Linter-clean, dark mode covered

**Estimated effort:** small phase (~half a day of focused work)

**Out of scope:** porting existing pages to use the new components (that's Phase 2+).

---

## Phase 2 — Home Page Redesign

**Goal:** the highest-priority deliverable per the user request. `/` becomes the showcase of the new design language.

**Pages:** `src/app/page.tsx` (the `HomePage` server component) + `src/components/landing-page.tsx` (the guest landing).

**Scope of changes:**
- **For guests** (landing variant): refine the two-CTA layout — sharper hierarchy, better visual rhythm, possibly a subtle hero illustration / abstract pattern (CSS-only, no images).
- **For authed users** (dashboard variant): redesign the projects list, surface "Create project" and "Planning Poker" entry points more clearly, polish the header.
- Use Phase 1's `<PageShell>`, `<Card>`, `<Button>` everywhere.

**UX improvements:**
- Header: clearer separation between brand, primary nav, and user menu
- Empty state for "no projects yet" with stronger CTA
- For guests: trust block (free / no tracking / minimal data) more prominent
- FAQ — collapsible accordion if visual weight justifies it (optional)

**Files touched (estimate):** 2-3 files (`page.tsx`, `landing-page.tsx`, maybe a small component extraction)

**Acceptance criteria:**
- Side-by-side comparison guest landing before/after
- Side-by-side comparison authed dashboard before/after
- All i18n keys reused (no new strings unless renaming labels)
- Mobile layout still clean
- Build + lint pass

**Estimated effort:** medium phase

---

## Phase 3 — Public Entry Pages

**Goal:** unify the visual language across all unauthenticated surfaces — what new users see before they're "in" the app.

**Pages:**
- `/poker` (Quick Poker landing)
- `/login`
- `/register`
- `/invite/[token]`
- `/onboarding`
- `/terms`, `/privacy`, `/cookies` (touch only nav/footer/header chrome — content stays as legally finalized)

**Scope of changes:**
- Replace inline form scaffolding with Phase 1 `<Card>`, `<Input>`, `<Button>`, `<Field>`
- Consistent header pattern across all four auth-adjacent pages (`<PageShell variant="public">`)
- Unify form vertical rhythm
- Consent UX (checkbox / browse-wrap) preserved exactly — touch only its visual presentation

**UX improvements:**
- "Forgot password" link consideration — actually skip (we don't have password recovery and won't add it; document the decision in changelog)
- Clearer "or" divider on `/poker` between create-room vs join-by-code
- Invite page: clearer role selection cards (DEV/QA/BA)
- Onboarding: ensure flow is obvious

**Files touched (estimate):** 6-8 files

**Acceptance criteria:**
- Auth flow (register → login → logout) still works end-to-end
- Invite link redemption still works
- Guest creation in `/poker` still works
- Legal pages have updated chrome but unchanged body content
- Build + lint pass

**Estimated effort:** medium phase

---

## Phase 4 — App Pages (where users live)

**Goal:** redesign the main authenticated surfaces — the screens users spend the most time on.

**Pages (in order of complexity, ascending):**
1. `/settings` (user profile) — simplest
2. `/project/[id]/settings` — medium
3. `/poker/[code]` (Quick Room board) — medium-high (already polished in Phase 2 of dev cycle, light touch)
4. `/project/[id]/estimation` (Estimation board) — high complexity
5. `/project/[id]` (Gantt board) — highest complexity, do last

**Scope of changes:**
- All headers use Phase 1's `<PageShell variant="app">` with consistent back-button placement (top-left), title in center, user menu top-right
- All settings sections become `<Card>` with `<SectionHeader>` + form rows
- Estimation board: tighter sidebar/main split, clearer "you are voting" vs "host controls" zones
- Gantt: clarify zoom controls, sprint markers, assignment chips; this is the riskiest one — touch carefully
- Quick Room: keep most of the recent polish; align header chrome with the new shell

**UX improvements (cross-cutting):**
- All destructive actions (delete, kick, leave) have consistent confirm pattern
- All "save" buttons in settings get success toast (we already have a success-message convention)
- Estimation board: distribution chart and toggle stay; consider moving the "show to all" toggle to the host control bar instead of the chart header
- Gantt: cursor affordances for drag, hover-states on rows

**Files touched (estimate):** 10-15 files

**Acceptance criteria:**
- All 5 pages visually consistent
- Estimation flow still works (vote → reveal → accept)
- Gantt drag-drop still works
- Settings save → polling reflects new state
- Build + lint pass
- Manual smoke test of every flow recorded in Phase 5

**Estimated effort:** large phase — most of the redesign budget lives here

---

## Phase 5 — Polish + Audit

**Goal:** cross-cutting consistency check, error pages, final QA.

**Scope:**
- Apply new shell to `/not-found` and `/error`
- Audit each page side-by-side: are buttons in the same place? Same paddings? Same color usage? List discrepancies and fix
- Accessibility pass: focus rings visible, semantic HTML, `aria-*` on icon-only buttons, screen-reader sanity
- Performance: any new component bloating bundle? Re-check
- Update `docs/changelog.md` with the full milestone summary
- Update `skills/frontend-dev/references/ui-patterns.md` final version
- Optional: before/after screenshots in `docs/redesign-2026-06/`

**Acceptance criteria:**
- Full smoke test checklist passed (see Phase 5 plan when we get there)
- Build green, no new lint errors
- Changelog entry written
- Skills updated

**Estimated effort:** small phase

---

## Phase dependencies & ordering

| Phase | Depends on | Can defer? |
|---|---|---|
| 1 (Foundation) | — | No, blocks everything |
| 2 (Home) | 1 | No, user's stated #1 priority |
| 3 (Public) | 1 | Yes, but logically grouped with 2 |
| 4 (App) | 1, lessons from 2+3 | No, biggest surface |
| 5 (Polish) | 1-4 | No, milestone-closer |

## Total estimated effort

- Phase 1: small
- Phase 2: medium
- Phase 3: medium
- Phase 4: large
- Phase 5: small

= roughly 5 working days of focused single-developer work, spread over a couple of weeks of background time.
