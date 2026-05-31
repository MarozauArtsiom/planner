# Skills

Project-specific Claude Code skills, adapted from [MiniMax-AI/skills](https://github.com/MiniMax-AI/skills) and tuned to this codebase's exact stack and conventions.

## What's here

| Skill | Purpose | When AI should trigger |
|---|---|---|
| [`frontend-dev`](./frontend-dev/SKILL.md) | UI / pages / components / animations / i18n / consent UX | Building or editing anything under `src/app/**/page.tsx`, `src/components/`, `src/hooks/` (client-side), `messages/*.json`, `src/app/globals.css` |
| [`backend-dev`](./backend-dev/SKILL.md) | Server Actions / API routes / Prisma / auth / cron | Changes in `src/app/actions/`, `src/app/api/`, `prisma/`, `src/lib/{db,session,permissions,legal}.ts`, `vercel.json` |
| [`gsd-workflow`](./gsd-workflow/SKILL.md) | Navigational layer for GSD Core — when/why/how to use the 67 `/gsd-*` commands installed under `.claude/` | Starting a new milestone / phase, audits, debugging, multi-file refactors. NOT for one-file edits. |

Both skills are **derived from** the upstream MiniMax skills but **stripped of**:
- MiniMax API (image/video/music/TTS generation)
- GSAP / Framer Motion / Three.js / Lottie (we use CSS only)
- Django / Python / Go (we are Next.js + TypeScript only)
- JWT / refresh tokens / OAuth (we use httpOnly cookie session)
- WebSocket / SSE (we use HTTP polling)
- React Query / tRPC (we use native fetch + custom polling hooks)
- File uploads / presigned URLs (we don't handle file uploads)

…and **focused on**:
- The actual file layout under `src/`
- Real components and actions you can grep and copy from
- The 7-language `messages/*.json` discipline
- Prisma + SQLite (dev) / Turso libSQL (prod) conditional adapter
- Custom session in `src/lib/session.ts`
- Polling at 5s, lazy cleanup + Vercel Cron
- Legal-constants pattern (`src/lib/legal.ts`)

## Structure

```
skills/
├── README.md                    # This file
├── frontend-dev/
│   ├── SKILL.md                 # Core skill + invocation
│   └── references/
│       ├── project-stack.md     # Versions + file map
│       ├── ui-patterns.md       # Reusable snippets (buttons, cards, modals)
│       ├── i18n-workflow.md     # 7-language discipline
│       └── motion-recipes.md    # CSS-only animations
├── backend-dev/
│   ├── SKILL.md                 # Core skill + invocation
│   └── references/
│       ├── project-stack.md     # DB / env / file map
│       ├── server-actions.md    # Template + checklist
│       ├── prisma-patterns.md   # Schema patterns
│       ├── auth-flow.md         # Session + permissions
│       └── release-checklist.md # Pre-deploy gates
└── gsd-workflow/
    ├── SKILL.md                          # When/why to use GSD
    └── references/
        └── integration-with-our-stack.md # How GSD composes with frontend/backend skills
```

The **actual GSD command implementations** (67 slash-commands + 33 sub-agents + workflows + templates) live at `.claude/`:

```
.claude/
├── commands/gsd/        # 67 /gsd-* slash commands
├── agents/              # 33 gsd-* sub-agents (auto-invoked)
├── hooks/lib/           # Hook helpers (hooks themselves not wired by default)
└── get-shit-done/       # Workflows, references, templates
```

The `skills/gsd-workflow/` is a **thin navigational layer** pointing at the `.claude/` install. The two together (`.claude/` + `skills/gsd-workflow/`) are the GSD integration.

## How Claude Code uses these

If you're using Claude Code with a custom skill discovery path, point it at this directory.

For one-off use, you can also paste the relevant SKILL.md into context when starting a focused task ("I'm working on X — here's how we do things in this repo: <paste SKILL.md>").

## When to update

Update a skill when you change a project-wide convention. For example:

- Replaced cookie-session with JWT? → rewrite `backend-dev/references/auth-flow.md`
- Adopted a new color in the palette? → update `frontend-dev/references/ui-patterns.md`
- Added an 8th language? → mention in `frontend-dev/references/i18n-workflow.md`
- Migrated from Turso to Postgres? → rewrite `backend-dev/references/project-stack.md`

These skills should always match what `git grep` actually finds in the codebase. If they drift, they hurt more than they help.

## Source attribution

- `frontend-dev`, `backend-dev` — adapted from [MiniMax-AI/skills](https://github.com/MiniMax-AI/skills) (MIT). Significantly stripped and rewritten to match this codebase.
- `gsd-workflow` + `.claude/` install — [open-gsd/gsd-core](https://github.com/open-gsd/gsd-core) (MIT, v1.2.0). Installed via the upstream installer (`bin/install.js --claude --local`). Hooks not wired by default.

All adapted content here intentionally diverges from upstream to reflect this codebase's actual stack and patterns.
