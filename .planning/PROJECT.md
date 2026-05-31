# PROJECT — Planning Poker

## What this product is

A free, privacy-first **planning poker / sprint estimation** tool with two distinct entry points:

1. **Quick Poker** (`/poker`) — corporate-safe, no signup, no ticket names, 24h ephemeral rooms. For teams who can't input task data into external tools (NDA / DLP constraints).
2. **Sprint Planner** (full app, requires signup) — persistent projects, multi-method estimation, Gantt-style sprint planning, PDF reports, CSV ticket import.

Operated as a personal project by **Planning Poker by Artsiom Marozau** (Poland, EU). Free forever, no tracking, GDPR-compliant.

## Tech stack (canonical reference: `skills/{frontend-dev,backend-dev}/references/project-stack.md`)

- **Frontend:** Next.js 16 App Router + React 19 + TypeScript 5 + Tailwind CSS 4 + next-intl (7 languages)
- **Backend:** Server Actions + Route Handlers + Prisma 7 + SQLite (dev) / Turso libSQL (prod) + custom httpOnly cookie session
- **Real-time:** HTTP polling at 5s
- **Hosting:** Vercel + Vercel Cron (hourly cleanup)
- **Hard rule:** no analytics, no third-party SDKs beyond stack essentials

## History

| Phase | Outcome | Date |
|---|---|---|
| Epic 0 — Auth + Projects | Login/register, project membership, invite links | 2026-03 |
| Epic 1 — Onboarding + roles | DEV/QA/BA roles, role-aware UI | 2026-03 |
| Epic 2 — Estimation session | Composite 4-factor voting, reveal flow | 2026-03 |
| Epic 3 — Timeline setup | Sprint creation, naming templates | 2026-03 |
| Epic 4 — Gantt board | Drag-drop assignment, parallel rows | 2026-03 |
| Epic 5 — Time-offs | Vacation/sick leave handling | 2026-03 |
| Epic 6 — Multi-SM | Per-project SM rights | 2026-03 |
| Epic 7 — Project settings | SP scale, sprint duration, name template | 2026-03 |
| Epic 8 — i18n | 7 languages | 2026-03 |
| Epic 9 — Sprint report PDF export | Gantt + tables in landscape A4 | 2026-03 |
| Epic 10 — Planning Poker mode | Quick Rooms, multi-method estimation, governance | 2026-05 |
| **Phase 2 (Final)** | **Legal pages, landing redesign v1, governance, polish, cron cleanup** | **2026-05-31** |

The product is **functionally complete** as of Phase 2. It is ready for public launch.

## Active milestone

**M-Visual-Redesign** — visual & UX polish without functional changes (see `REQUIREMENTS.md` / `ROADMAP.md`).

## What stays out

- New features (we're done feature-wise)
- New integrations (Jira/Slack/etc.)
- Premium tiers (free forever)
- Analytics / telemetry (privacy stance)
- Backend changes beyond extracting design-token consts
