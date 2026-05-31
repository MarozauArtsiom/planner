---
name: gsd-workflow
description: |
  Navigational reference for GSD Core (Git. Ship. Done.) — a meta-prompting,
  context-engineering, spec-driven development system installed under `.claude/`.
  TRIGGER when: starting a new feature/milestone, planning multi-phase work,
  needing structured execution with parallel sub-agents, recovering from context
  drift, doing codebase mapping/audits/forensics. Use `/gsd-help` first to see
  the 67 available commands, then follow the canonical 6-step loop.
  DO NOT TRIGGER for: small one-file edits, quick UI tweaks, bugfixes that
  don't need planning — GSD is overhead for those.
license: MIT
metadata:
  category: workflow
  version: "1.2.0"
  installed_at: ".claude/"
  upstream: "https://github.com/open-gsd/gsd-core"
---

# GSD Core — Workflow Skill

This skill is a **navigational layer** for the GSD Core toolkit installed under `.claude/`. The actual logic lives in `.claude/commands/gsd/*.md` (67 slash-commands) and `.claude/agents/gsd-*.md` (33 sub-agents).

This file tells the AI **when** to use which GSD command and **how the loop fits into this Planning Poker codebase**.

---

## Why GSD exists in this repo

The Planning Poker codebase is small but ongoing — Phase 2 is shipped, future iterations will likely involve:
- Multi-file refactors (e.g. migrating off Turso to Postgres)
- Larger features touching schema + UI + i18n + governance
- Audits before public release
- Recovering momentum after weeks away

GSD provides a structured, spec-driven workflow that prevents context rot and produces commits-per-task. Use it for **anything spanning >3 files or >1 session**. For small edits, skip it and just edit.

---

## The Six-Command Canonical Loop

```
/gsd-new-project       → initial setup (first time only, or for major pivot)
        ↓
/gsd-discuss-phase N   → capture decisions for phase N before planning
        ↓
/gsd-plan-phase N      → research + plan in parallel, until plan passes verification
        ↓
/gsd-execute-phase N   → fresh sub-agents execute plans in parallel, each task = one atomic commit
        ↓
/gsd-verify-work N     → walk through what was built; broken pieces get diagnosed fix plans
        ↓
/gsd-ship N            → ship the phase
        ↓ (loop back to discuss-phase for N+1)
        ↓
/gsd-complete-milestone → archive, tag, document
/gsd-new-milestone     → start next milestone fresh
```

**The point**: each step has one job. Each plan fits in a fresh 200k context window. Each execution is parallel and atomic. The user's main context stays at 30–40%.

---

## First-Time Onboarding (use this on this codebase)

Since Planning Poker already exists, **do NOT run `/gsd-new-project` first**. Instead:

1. **`/gsd-map-codebase`** — Indexes the existing stack (Next.js, Prisma, conventions). This must run before any other GSD command on an existing codebase.
2. **`/gsd-new-project`** — Now it has context to ask the right scoping questions about your next milestone.

After that the normal loop applies.

---

## Command Categories (67 total)

Group the commands mentally so you don't get lost. Full list: `ls .claude/commands/gsd/`.

| Category | Commands | When |
|---|---|---|
| **Setup** | `map-codebase`, `new-project`, `new-milestone`, `complete-milestone` | Once per project / milestone |
| **Six-step loop** | `discuss-phase`, `plan-phase`, `execute-phase`, `verify-work`, `ship`, `phase` | Every phase |
| **MVP shortcut** | `mvp-phase`, `ai-integration-phase` | Faster paths when scoping is simple |
| **Recovery** | `pause-work`, `resume-work`, `extract-learnings`, `ns-context` | When context degrades mid-session |
| **Audits** | `audit-fix`, `audit-milestone`, `audit-uat`, `code-review`, `eval-review` | Pre-release, post-release |
| **Debug / forensics** | `debug`, `forensics`, `health` | Production issues, regressions |
| **Docs** | `docs-update`, `ingest-docs`, `import` | Keep `docs/` in sync |
| **Inspection** | `explore`, `inbox`, `capture`, `manager`, `phase`, `help` | Read-only commands |
| **Automation** | `autonomous`, `fast`, `graphify`, `cleanup`, `pause-work` | Power user |
| **Note-system (`ns-*`)** | `ns-project`, `ns-ideate`, `ns-workflow`, `ns-manage`, `ns-review` | Capture-first / spec-first projects |
| **Quality** | `add-tests`, `tdd-loop`, `release` | Testing + shipping |

**The 33 sub-agents** (`.claude/agents/gsd-*.md`) are invoked **automatically** by the commands. You don't need to know them by name unless debugging the workflow itself.

---

## How GSD interacts with our existing skills

| Concern | Where to look |
|---|---|
| Need to add UI / form / page | `skills/frontend-dev/SKILL.md` first → then `/gsd-plan-phase N` if it's multi-file |
| Need new schema / action / API | `skills/backend-dev/SKILL.md` first → then `/gsd-plan-phase N` |
| Need to plan an entire milestone | `/gsd-new-milestone` then loop — front-end and back-end skills referenced inside the plan |
| Quick bugfix or single-file change | Skip GSD entirely. Edit, build, lint, done. |

**Rule:** the per-stack skills (`frontend-dev`, `backend-dev`) define **how** to write code in this codebase. GSD defines **when** and **in what order** to do larger pieces of work. They compose — they don't compete.

---

## File Map of the installed GSD

```
.claude/
├── commands/
│   └── gsd/              # 67 .md files — slash-commands (/gsd-*)
├── agents/               # 33 gsd-*.md sub-agents (auto-invoked)
├── hooks/                # Hook helpers (most hooks not installed by --local; can be added later)
│   └── lib/
└── get-shit-done/
    ├── VERSION
    ├── CHANGELOG.md
    ├── bin/              # Helper scripts referenced by commands
    │   └── shared/       # model-catalog, config-defaults, runtime-aliases
    ├── workflows/        # Workflow definitions referenced from commands
    ├── references/       # Long-form references (questioning, ui-brand, …)
    ├── templates/        # Templates for PROJECT.md, REQUIREMENTS.md, etc.
    └── contexts/
```

GSD creates a working directory at `.planning/` in the project root when you run `/gsd-new-project`. Files like `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` are produced incrementally during the loop. Add `.planning/` to `.gitignore` if you don't want planning artifacts committed (or do commit them — they're useful for team history).

---

## When NOT to use GSD

| Situation | Why skip |
|---|---|
| Editing one component | Overhead > benefit |
| Quick fix to copy / styling | Just do it |
| Reading code to understand | Use `Read`/`grep` directly |
| Adding one i18n key | Just add it (see `frontend-dev` i18n workflow) |
| Single migration | Just write it (see `backend-dev` prisma patterns) |

| Situation | Why use |
|---|---|
| New milestone (e.g. "add billing", "add Slack integration") | Multi-file, multi-day work |
| Pre-release audit | Use `/gsd-audit-milestone` |
| Production incident | Use `/gsd-debug` and `/gsd-forensics` |
| Returning to project after weeks | Use `/gsd-map-codebase` then `/gsd-resume-work` |
| Plan that needs >3 sub-decisions before coding | Use `/gsd-discuss-phase` to capture them |

---

## Hooks (not installed by default)

The `--local` install we ran **does not** add the runtime hooks (context-monitor, prompt-guard, read-guard, phase-boundary, etc.). They live in `.claude/hooks/lib/` as helpers, but the `settings.json` entries are not wired.

If/when you want them: re-run the installer with appropriate flags (see GSD docs). Hooks add:
- **context-monitor** — warns when your context approaches limits
- **prompt-guard** — blocks risky patterns (prompt injection in fetched content)
- **read-guard** + **read-injection-scanner** — same for read tool output
- **phase-boundary** — enforces commit hygiene at phase transitions
- **statusline** — shows GSD state in Claude Code status bar

For now, we skip them (avoids modifying `settings.json`, which the user controls).

---

## Quick "Where do I start" decision tree

```
Is this >3 files / >1 hour of work?
│
├─ NO  → just edit. Use frontend-dev / backend-dev skills.
│
└─ YES → Is `.planning/PROJECT.md` set up?
         │
         ├─ NO  → /gsd-map-codebase, then /gsd-new-project
         │
         └─ YES → /gsd-new-milestone (or continue existing milestone)
                  → /gsd-discuss-phase N
                  → /gsd-plan-phase N
                  → /gsd-execute-phase N
                  → /gsd-verify-work N
                  → /gsd-ship N
```

---

## Upgrades

To get a newer GSD version:

```bash
node /Users/artsiommarozau/Documents/projects/pers/gsd-core/bin/install.js --claude --local
```

Or, from any directory (after publish):

```bash
npx @opengsd/gsd-core@latest --claude --local
```

Re-running is safe — the installer is idempotent and adds new commands as the upstream evolves.

---

## References

| Need | File |
|---|---|
| What every command does | `.claude/commands/gsd/<name>.md` (every file has frontmatter `description:`) |
| Get started in one place | Run `/gsd-help` inside Claude Code |
| Upstream docs | https://github.com/open-gsd/gsd-core |
| How GSD composes with our codebase patterns | [references/integration-with-our-stack.md](references/integration-with-our-stack.md) |
