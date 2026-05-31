# Backend Stack — Quick Reference

## Runtime

| | |
|---|---|
| Node | 20+ |
| Server | Next.js 16.1.6 — Server Components + Server Actions + Route Handlers |
| Build | `prisma generate && next build` |

## Database

| Env | Provider | Adapter | URL env var |
|---|---|---|---|
| Dev | SQLite (file) | `@prisma/adapter-better-sqlite3` | `DATABASE_URL="file:./dev.db"` |
| Prod | Turso (libSQL) | `@prisma/adapter-libsql` | `TURSO_DATABASE_URL` |

Branching logic: `src/lib/db.ts` constructs the right adapter at runtime.

```ts
// pseudocode of what src/lib/db.ts does
const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
const adapter = url?.startsWith("libsql://")
  ? new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  : new PrismaBetterSQLite3({ url });
export const prisma = new PrismaClient({ adapter });
```

## Auth

| | |
|---|---|
| Mechanism | httpOnly cookie `userId` |
| Source | `src/lib/session.ts` (`getSession`/`setSession`/`clearSession`) |
| Password | bcrypt via `src/lib/password.ts` |
| Middleware | `src/proxy.ts` (named `proxy.ts`, not `middleware.ts`) |
| Public paths | `PUBLIC_PATHS = ["/login","/register","/invite","/poker","/terms","/privacy","/cookies"]` |

No JWT. No OAuth. No third-party identity providers. By design — keeps the stack tiny.

## Real-time

| | |
|---|---|
| Method | HTTP polling |
| Interval | 5s (estimation, board), 3s (global notification) |
| Hooks | `src/hooks/use-*-polling.ts` |
| Endpoints | `src/app/api/.../route.ts` with `export const dynamic = "force-dynamic"` |

No SSE. No WebSocket. By design — Vercel hobby tier has no persistent connections.

## Deployment

| | |
|---|---|
| Host | Vercel |
| Cron | Vercel Cron via `vercel.json` |
| Cron auth | `Authorization: Bearer ${CRON_SECRET}` |
| Build script | `prisma generate && next build` (package.json) |
| Postinstall | `prisma generate` |

## File Map

| Concern | File(s) |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| Migrations | `prisma/migrations/<timestamp>_<name>/migration.sql` |
| Seed | `prisma/seed.ts` |
| DB client | `src/lib/db.ts` |
| Session | `src/lib/session.ts` |
| Password | `src/lib/password.ts` |
| Permissions | `src/lib/permissions.ts` |
| Project actions | `src/app/actions/<feature>.ts` (auth, estimation, project, quick-room, assignment, sprint, timeoff, locale) |
| Read API | `src/app/api/<area>/<thing>/route.ts` |
| Cron | `src/app/api/cron/cleanup-expired/route.ts` + `vercel.json` |
| Legal/app constants | `src/lib/legal.ts` |
| Business helpers | `src/lib/estimation-engine.ts`, `src/lib/sp-scale.ts`, `src/lib/quick-room.ts`, `src/lib/date-utils.ts`, `src/lib/current-user.ts` |

## Schema Snapshot (key models)

```
User           id, name, passwordHash?, isGuest, expiresAt?, role?
Project        id, name, ownerId, isQuick, accessCode?, expiresAt?,
               estimationMethod, workingHoursPerDay, showDistributionToAll,
               sprintDurationWeeks, sprintNameTemplate, taskCoefficient,
               activeSprintId?
ProjectMember  userId, projectId, role?, isScrumMaster      @@unique(userId, projectId)
Sprint         id, name, startDate, endDate, projectId
Ticket         id, title, externalId?, externalUrl?, description?,
               acceptanceCriteria?, storyPoints?, devEffortProportion?,
               projectId, sprintId?
Vote           userId, ticketId, devEffort?, qaEffort?, risk?,
               uncertainty?, singleValue?                   @@unique(userId, ticketId)
EstimationSession id, status, activeTicketId?, projectId, sprintId?
TicketAssignment id, userId, ticketId, startDate, durationDays, type,
                 parentAssignmentId?
TimeOff        id, userId, date, type                       @@unique(userId, date)
InviteLink     id, token, grantsSm, label?, projectId
SpScaleItem    id, value, label, durationDays, projectId    @@unique(projectId, value)
```

## Required Env Vars

| Var | Where | Dev | Prod |
|---|---|---|---|
| `DATABASE_URL` | DB connection (dev) | `file:./dev.db` | ❌ unset |
| `TURSO_DATABASE_URL` | DB connection (prod) | ❌ unset | `libsql://...` |
| `TURSO_AUTH_TOKEN` | DB token (prod) | ❌ unset | `<jwt>` |
| `CRON_SECRET` | Cron handler auth | optional | required |
| `NODE_ENV` | Runtime mode | `development` | `production` |

`.env` and `.env.local` are gitignored. Never commit secrets.
