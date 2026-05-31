# GSD ↔ Planning Poker Stack — How They Compose

GSD is **process** (when/in-what-order). Our `frontend-dev` and `backend-dev` skills are **practice** (how to write the code itself). Mapping below.

## Phase Template for THIS codebase

When `/gsd-plan-phase N` runs, the planner agent should produce plans that follow our conventions. Use this template mentally when reviewing a generated plan:

### Schema change phase
1. Edit `prisma/schema.prisma`
2. `DATABASE_URL="file:./dev.db" npx prisma migrate dev --name <descriptive_name>`
3. Update affected Server Actions in `src/app/actions/*.ts`
4. Update affected GET routes in `src/app/api/.../route.ts`
5. Update affected hook types in `src/hooks/use-*-polling.ts`
6. Update UI components consuming the new fields
7. Add i18n keys to **all 7** `messages/*.json`
8. Run `DATABASE_URL="file:./dev.db" npm run build && npm run lint`
9. Update `docs/changelog.md`

### UI-only phase
1. Build / edit components in `src/components/` or `src/app/<route>/page.tsx`
2. New i18n keys in all 7 languages
3. Dark mode classes on every color
4. `"use client"` only on leaves
5. Loading / empty / error states
6. Footer on public pages
7. Build + lint

### Governance / legal phase
1. Update `src/lib/legal.ts` if constants change
2. Update `/terms`, `/privacy`, `/cookies` content
3. Consent UX (checkbox or browse-wrap) on any new entry point
4. Footer link verification

## What GSD's `/gsd-map-codebase` will find

When you first run `/gsd-map-codebase` on this repo, it should index:

| Layer | Where |
|---|---|
| Routes | `src/app/**/page.tsx` |
| Server Actions | `src/app/actions/*.ts` |
| GET API | `src/app/api/**/route.ts` |
| Components | `src/components/**/*.tsx` |
| Hooks | `src/hooks/*.ts` |
| Lib (pure utils) | `src/lib/*.ts` |
| Schema | `prisma/schema.prisma` |
| Migrations | `prisma/migrations/*/migration.sql` |
| i18n | `messages/*.json` (7 files) |
| Docs | `docs/changelog.md`, `docs/features/epic-*.md` |
| Skills | `skills/*/SKILL.md` |

The mapper will produce `.planning/codebase.md` or similar. Cross-check it against `skills/{frontend-dev,backend-dev}/references/project-stack.md` — they should be consistent.

## What GSD's executor agents need to know

The `/gsd-execute-phase` runs `gsd-executor` sub-agents in parallel. They run with fresh 200k contexts but **don't see this skill automatically**. When the plan refers to "Planning Poker conventions", the executor will look at:

1. The plan file itself (must include enough context)
2. `CLAUDE.md` if it exists at repo root (we don't currently have one — consider adding)
3. Files it reads via `Read` / `grep`

**Recommendation:** when reviewing a GSD plan before `/gsd-execute-phase`, ensure it references the right files in our codebase (`src/app/actions/`, `src/lib/`, `messages/`). If not, edit the plan to add explicit file paths.

## Phase Sizing Heuristics

GSD plans should be sized to fit a single executor's context:

| Size | What goes in one phase |
|---|---|
| Tiny | < 5 files, < 50 lines changed → don't use GSD |
| Small | 5–15 files, one bounded feature → one phase |
| Medium | 15–30 files, multi-aspect (schema + actions + UI + i18n) → still one phase if cohesive |
| Large | > 30 files, multiple independent features → split into 2-3 phases |
| XL | New product surface area → split into milestone with 3+ phases |

Phase 2 of this project (governance + landing redesign + Quick Room polish) would have been a **Large phase** — split into 2.1 (closing epic), 2.2 (governance), 2.3 (redesign), 2.4 (polish).

## What we deliberately don't use from GSD

| GSD feature | Why skip in this repo |
|---|---|
| Hooks (context-monitor, prompt-guard, etc.) | `--local` install left them off; we control `settings.json` |
| `gsd-graphify` | Pre-Q tool for big codebases; ours is small enough to fit in any context |
| `gsd-eval-*` (eval-review, eval-auditor) | We don't have an eval framework set up yet |
| `gsd-ai-integration-phase` | We don't have AI integrations (and don't plan to per privacy stance) |
| Note-system (`ns-*`) commands | Already covered by `docs/features/epic-*.md` pattern |

## Workflow Comparison

| Task | Without GSD | With GSD |
|---|---|---|
| "Add feature X" (small) | Edit files, build, ship | Edit files, build, ship — skip GSD |
| "Add feature X" (medium) | Manual planning in head | `/gsd-plan-phase` produces plan |
| "Add feature X" (large) | Risk of context drift mid-work | `/gsd-execute-phase` parallelizes |
| "Audit before release" | Manual checklist walk | `/gsd-audit-milestone` |
| "Debug prod issue" | Manual stack trace analysis | `/gsd-debug` + `/gsd-forensics` |
| "Resume project after weeks away" | Read commits + docs to remember | `/gsd-resume-work` |

## When the two skills disagree

If `gsd-executor` proposes something that conflicts with `frontend-dev` or `backend-dev` conventions (e.g. it suggests adding Framer Motion, or a JWT layer):

1. **Stop the execute step**
2. Edit the plan to align with our skill (or push back via `/gsd-discuss-phase` clarification)
3. Re-run `/gsd-plan-phase` if needed

Our `frontend-dev` / `backend-dev` skills encode **non-negotiable** project decisions. GSD plans must adapt to them, not the other way around.
