# REQUIREMENTS — Milestone: Visual Redesign

## In one sentence

**Visual + UX polish of every page** — keep the existing flow and functionality 100% intact, but make the UI more cohesive, intuitive, and easier to navigate. The redesign is **cosmetic and ergonomic only** — no schema changes, no new features, no flow changes.

## Goals (explicit user request)

1. **Redesign the home page** (highest priority — separate phase)
2. **Redesign all other pages** to match the new visual language
3. **UX polish**: make buttons easier to find, more intuitive to use, better placement, clearer hierarchy
4. Keep the **functional flow unchanged** — same screens, same steps, same Server Actions, same data shape

## Non-goals (explicitly out of scope)

- ❌ Changing the user journey / step ordering
- ❌ Adding/removing screens or features
- ❌ Backend changes (Server Actions, Prisma schema, API routes, auth)
- ❌ i18n key additions (unless renaming/relabeling buttons — minimal)
- ❌ Animation library introduction (CSS only stays)
- ❌ Icon library introduction (inline SVG stays)
- ❌ Component library introduction (hand-rolled with Tailwind stays)
- ❌ Dark mode rework (already covered; keep as-is)
- ❌ Mobile-first redesign (already responsive; keep as-is, just polish)

## Pages in scope

| Page | Status | Phase |
|---|---|---|
| `/` (landing variant + dashboard variant) | Active | 2 |
| `/poker` (Quick Poker landing) | Active | 3 |
| `/poker/[code]` (Quick Room board) | Active | 4 |
| `/login` | Active | 3 |
| `/register` | Active | 3 |
| `/invite/[token]` | Active | 3 |
| `/onboarding` | Active | 3 |
| `/project/[id]` (Gantt board) | Active | 4 |
| `/project/[id]/estimation` (Estimation board) | Active | 4 |
| `/project/[id]/settings` | Active | 4 |
| `/settings` (user profile) | Active | 4 |
| `/terms`, `/privacy`, `/cookies` | Polish only | 5 |
| `/not-found`, `/error` | Polish only | 5 |

## UX principles to apply across the redesign

1. **Primary action visible above the fold.** Every screen has one "what does the user do here?" — surface it.
2. **Action affordance.** Critical buttons get both icon + text (not just text), with tooltips on icon-only ones.
3. **Consistent button placement.**
   - Top-right of header: primary action / user menu
   - Top-left of header: back / navigation
   - Bottom of forms: primary submit (full-width on mobile)
4. **Findability.** Reduce cognitive load — group related actions, separate destructive from neutral, use color+position consistently.
5. **One color story.** Blue for primary, neutral zinc for backgrounds, semantic colors only for meaning (red = danger, emerald = success, amber = warning, violet = BA/special).
6. **Status visibility.** Loading, empty, error, success — each has a distinct, instantly-recognizable visual.
7. **Whitespace as hierarchy.** Less border noise, more spacing between groups.
8. **Same visual rhythm across pages.** A user landing on `/project/[id]` should feel "yes, this is the same app as `/poker`".

## Constraints

- **Tailwind 4 only.** Existing `globals.css` keyframes stay. Any new tokens go through `tailwind.config` or `@theme` if needed.
- **Server Actions and data props stay unchanged.** Components might be re-laid-out but their Props API is preserved unless explicitly justified.
- **Build must stay clean** after every phase (`DATABASE_URL="file:./dev.db" npm run build && npm run lint`).
- **i18n discipline preserved.** No new hard-coded strings; if a label changes, update all 7 `messages/*.json`.
- **Skills stay in sync.** Update `skills/frontend-dev/references/ui-patterns.md` when a pattern changes.

## Definition of Done (whole milestone)

- [ ] Every in-scope page rebuilt against the new design system
- [ ] One shared `<PageShell>`, `<Card>`, `<Button>`, `<IconButton>` etc. — no inline duplicates
- [ ] Cross-page visual diff: open any 3 pages — they feel like one product
- [ ] No regression in any flow (manual smoke test list in Phase 5)
- [ ] Build clean, lint no new errors
- [ ] `skills/frontend-dev/references/ui-patterns.md` reflects the new conventions
- [ ] `docs/changelog.md` documents the milestone
- [ ] (Optional) Before/after screenshots in `docs/redesign-2026-06/`

## Risk register

| Risk | Mitigation |
|---|---|
| Component refactor breaks a page silently | After each phase, smoke-test the touched pages manually |
| Tailwind class explosion (everyone hand-rolls again) | Phase 1 ships `<Button>`, `<Card>`, `<IconButton>` — then enforce via reviews |
| i18n drift (renaming a key) | Use rename script: search→replace in code AND all 7 JSONs in one PR per phase |
| Dark mode regression | Every new class must pair `dark:` — Phase 1 lint rule (optional) |
| Estimation board layout breaks because it's complex | Treat it as its own sub-phase inside Phase 4; touch last |
| User confusion if button positions move | Document moves in changelog; "what changed" toast on first load post-deploy (optional, Phase 5) |
