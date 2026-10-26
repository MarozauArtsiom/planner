<!-- llm-wiki:start -->
## LLM Wiki knowledge bases (long-term project memory)
Domain knowledge (requirements, decisions, findings) lives in the knowledge bases below, not in chat history.
Consult the wiki before asking the user to repeat context. Use `/save-raw N` to snapshot valuable chat content, `/ingest-wiki` to compile it. Never edit `raw/` by hand; follow each KB's AGENTS.md.
- `knowledge/retro-market/` — Retro Tools Market: read `knowledge/retro-market/AGENTS.md` and `knowledge/retro-market/SCHEMA.md` before any work on this domain.
<!-- llm-wiki:end -->

## Project Context — Agile Ecosystem (Planner & Sprint Retro)
This repository is an Agile ecosystem combining:
1. **Sprint Planning & Gantt Chart** (`/project/[id]`)
2. **Planning Poker & Estimation** (`/project/[id]/estimation`, `/poker`)
3. **Sprint Retrospective** (`/project/[id]/retro`, `/retro`, `/retro/[token]`)

### Tech Stack & Skills
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 7 (SQLite dev / Turso prod), next-intl (7 languages).
- **Architecture Guidelines:**
  - Backend: Consult `skills/backend-dev/SKILL.md` (Server Actions, Polling API, Prisma patterns, cookies/auth).
  - Frontend: Consult `skills/frontend-dev/SKILL.md` (Shared UI in `@/components/ui`, Tailwind 4, i18n in all 7 languages).
  - Retro Specs: Read `product/retro-board-features.md` and `product/planner-retro-integration-plan.md`.
