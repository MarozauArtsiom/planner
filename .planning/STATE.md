# STATE — Planning Poker

## Current milestone

**M-Visual-Redesign** — visual & UX polish (see `ROADMAP.md`)

## Current phase

**Phase 0 — Roadmap drafted, awaiting user approval.**

Next step: user reviews `ROADMAP.md` + this file → confirms scope, ordering, and whether to deep-dive Phase 1 now (`/gsd-discuss-phase 1`).

## Phase status

| # | Name | Status | Notes |
|---|---|---|---|
| 1 | Design Foundation | 🟡 Draft pending approval | Components + tokens |
| 2 | Home Page Redesign | 🔵 Planned | User's stated #1 priority |
| 3 | Public Entry Pages | 🔵 Planned | `/poker`, `/login`, `/register`, `/invite`, `/onboarding`, legal chrome |
| 4 | App Pages | 🔵 Planned | Settings, Quick Room, Estimation, Gantt |
| 5 | Polish + Audit | 🔵 Planned | Error pages, cross-page consistency, changelog |

Legend: 🔵 planned · 🟡 in progress · 🟢 done · ⚪ deferred · 🔴 blocked

## Open questions for the user

Before I create `phases/01-design-foundation/CONTEXT.md` (the discuss-phase artifact), I need 3 micro-decisions:

1. **Component naming convention.** Stick with `kebab-case.tsx` (project default) for the new `src/components/ui/*` set? **Default: yes.**

2. **Where do shared UI primitives live?** `src/components/ui/` (Shadcn-style) or `src/components/common/`? **Default: `src/components/ui/`** (clearer intent).

3. **Visual direction.** Three options for Phase 2 (Home):
   - (A) **Refined current** — keep the same hero + two-CTA + trust block + FAQ, just sharper typography, more whitespace, subtle visual flourishes
   - (B) **Editorial** — bigger type, more breathing room, magazine-style sectioning, single page-wide accent illustration
   - (C) **Product-led** — show a screenshot/mockup of the Quick Room or Gantt above the fold, lead with proof of capability

**Default if no preference: (A) Refined current.** Lowest risk, biggest delta-per-effort.

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-31 | Use GSD workflow for this milestone | Multi-file, multi-day, structured planning warranted |
| 2026-05-31 | 5-phase split (Foundation → Home → Public → App → Polish) | Dependency-clean; home priority preserved per user request |
| 2026-05-31 | No backend changes in this milestone | User explicit: "только внешний редизайн" |
| 2026-05-31 | No new dependencies (no Framer/GSAP/icon library) | Project philosophy preserved |

## Build / lint status (last verified)

- ✅ `DATABASE_URL="file:./dev.db" npm run build` — clean (as of Phase 2 final commit, 2026-05-31)
- ✅ `npm run lint` — only pre-existing `set-state-in-effect` warnings (not blocking)

## What's parked (out of milestone)

- Story 10.6 (Round history sidebar) — deferred indefinitely
- Story 10.9 (Auth-only toggle for Quick Rooms) — deferred indefinitely
- Hooks for GSD (`context-monitor`, `prompt-guard`, etc.) — user-owned settings.json decision
