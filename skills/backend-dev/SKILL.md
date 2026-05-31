---
name: backend-dev
description: |
  Backend development guide adapted to this project's exact stack: Next.js 16 Server Actions +
  Route Handlers + Prisma 7 (SQLite dev / Turso libSQL prod) + custom httpOnly cookie session +
  HTTP polling for real-time + Vercel deployment + Vercel Cron.
  TRIGGER when: writing Prisma schema / migrations, Server Actions in src/app/actions/*,
  API route handlers in src/app/api/**/route.ts, auth/session changes, permissions/RBAC,
  cron / cleanup jobs, validation, error handling, database queries, or production hardening.
  DO NOT TRIGGER for: pure UI / styling / animations — use `frontend-dev`.
license: MIT
metadata:
  category: backend
  version: "1.0.0"
  stack:
    - Next.js 16.1.6 (Server Actions + Route Handlers, App Router)
    - Prisma 7 + @prisma/client
    - SQLite via better-sqlite3 (dev) / Turso libSQL (prod) — conditional adapter in src/lib/db.ts
    - Custom session (httpOnly cookie, src/lib/session.ts, bcrypt for passwords)
    - HTTP polling for real-time (5-second interval)
    - Vercel hosting + Vercel Cron for scheduled jobs
  sources:
    - Adapted from MiniMax/skills fullstack-dev
    - Adjusted to the Planning Poker codebase conventions
---

# Backend Skill — Planning Poker

This skill encodes the conventions that already exist in this codebase. **Match the existing patterns before introducing new ones.** Always run `git grep` for existing examples first.

---

## 1. Architecture in One Picture

```
Browser
  │
  ├─ Server Action (mutation)       ──▶ src/app/actions/<feature>.ts
  │    "use server"; FormData input,
  │    returns { success } | { error }
  │
  ├─ GET API Route (read/polling)   ──▶ src/app/api/<area>/<thing>/route.ts
  │    NextResponse.json(...), every 5s
  │
  └─ Middleware (auth gate)         ──▶ src/proxy.ts
       Reads userId cookie, redirects to /login

Prisma Client                       ──▶ src/lib/db.ts
   Adapter: better-sqlite3 (dev) / libSQL (prod)
   Schema: prisma/schema.prisma
   Migrations: prisma/migrations/*

Session                             ──▶ src/lib/session.ts
   httpOnly cookie "userId" (1-year TTL, SameSite=Lax,
   Secure in prod). bcrypt password hashing.

Scheduled                           ──▶ src/app/api/cron/cleanup-expired/route.ts
   Triggered by Vercel Cron (vercel.json), hourly.
   Lazy cleanup also on read paths.
```

There is **no REST API for clients**. Everything client-facing is either:
- a **Server Action** (mutation, returns `{ success } | { error }` or calls `redirect()`), or
- a **GET route handler** under `/api/...` (polled by client hooks).

---

## 2. Server Actions — The Mutation Pattern

All mutations live in `src/app/actions/<feature>.ts`. The canonical structure (from `estimation.ts`):

```ts
"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";

// 1. Auth guards as helpers at the top of the file
async function requireUser() {
  const userId = await getSession();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");
  return user;
}

async function requireProjectMember(projectId: string) {
  const t = await getTranslations("errors");
  const user = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership) throw new Error(t("noProjectAccess"));
  return { user, membership };
}

// 2. Public exports — actions called from forms
export async function submitVote(projectId: string, formData: FormData) {
  const t = await getTranslations("errors");
  const { user, membership } = await requireProjectMember(projectId);

  // Validate
  const raw = formData.get("singleValue") as string | null;
  const value = raw != null ? parseFloat(raw) : NaN;
  if (!Number.isFinite(value) || value <= 0) {
    return { error: t("invalidCriteriaValues") };
  }

  // Mutate
  await prisma.vote.upsert({
    where: { userId_ticketId: { userId: user.id, ticketId } },
    create: { userId: user.id, ticketId, singleValue: value },
    update: { singleValue: value },
  });

  return { success: true };
}
```

**Mandatory rules for every Server Action:**

| Rule | Enforcement |
|---|---|
| `"use server"` at file top | Required for `src/app/actions/*` |
| Auth: `requireUser()` / `requireProjectMember()` / `requireProjectSM()` | Use existing helpers, don't roll your own |
| Validate ALL inputs from `FormData` before touching DB | Parse, check shape, return error if invalid |
| Error messages via `getTranslations("errors")` | Never hard-code English strings |
| Return `{ success: true, ... } \| { error: string }` OR call `redirect()` | Never throw — UI can't catch thrown errors gracefully |
| For multi-step writes — wrap in `prisma.$transaction` | Especially: delete + create patterns |

**Anti-pattern:** Don't write controllers separately. The Server Action is the controller, service, and validation all in one file (for this project's complexity level, layering would be over-engineering).

---

## 3. GET API Routes — The Polling Pattern

All read-only endpoints live under `src/app/api/.../route.ts`. Used by client polling hooks at 5-second intervals.

**Canonical structure** (from `src/app/api/estimation/session/route.ts`):

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic"; // disable static optimization for polling endpoints

export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const userId = await getSession();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorization (project membership / quick-room participation)
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // 3. Aggregate everything the client polling hook needs in ONE response
    //    (avoid N+1 round-trips from the browser)
    const [project, session, votes, tickets, scale] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.estimationSession.findFirst({ where: { projectId }, orderBy: { createdAt: "desc" } }),
      // ...
    ]);

    // 4. Return one big JSON consumable by the hook
    return NextResponse.json({
      sessionId: session?.id ?? null,
      status: session?.activeTicketId ? session.status : "IDLE",
      // ...
    });
  } catch (e) {
    console.error("[GET /api/estimation/session] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Rules:**

- `export const dynamic = "force-dynamic"` on every polling endpoint (Next.js otherwise caches them).
- Wrap the whole body in `try/catch` and log with the route path prefix (`[GET /api/...] Error:`).
- Aggregate all data the client needs in **one response** — avoid making the client poll multiple endpoints.
- 401 = no session. 403 = session valid but no access. 404 = resource doesn't exist. 400 = bad input.
- Never `throw` — always return `NextResponse.json({ error }, { status })`.

---

## 4. Auth & Session

### Source of truth
- **`src/lib/session.ts`** — `getSession()` / `setSession(userId)` / `clearSession()`. httpOnly cookie `userId`.
- **`src/lib/password.ts`** — bcrypt wrappers.
- **`src/proxy.ts`** — middleware that redirects unauthenticated users to `/login` unless the path is in `PUBLIC_PATHS`.

### Public paths
When adding a new route that should be accessible without auth, add it to `PUBLIC_PATHS` in `src/proxy.ts`. Examples already there: `/login`, `/register`, `/invite`, `/poker`, `/terms`, `/privacy`, `/cookies`.

### Guest users
- `User.isGuest: true` + nullable `passwordHash` + `expiresAt` (24h TTL).
- `User.name` is NOT unique — registration uses `findFirst({ where: { name, isGuest: false } })`.
- Guests can be host or member in Quick Rooms only. Lazy cleanup runs in `findActiveQuickRoom()`; cron cleanup runs hourly.

### Permissions
- **Regular projects:** `hasSmRights(userId, membership, project)` from `src/lib/permissions.ts` — checks `project.ownerId === userId` OR `membership.isScrumMaster === true`.
- **Quick Rooms:** `project.isQuick === true` ⇒ only `project.ownerId === userId` is "host". `requireProjectSM` already branches on `isQuick`.

**Rule:** Never write a new auth check. Use `requireUser`, `requireProjectMember`, `requireProjectSM` from `src/app/actions/estimation.ts` or replicate the pattern.

---

## 5. Prisma — Schema & Migrations

### Schema
- File: `prisma/schema.prisma`
- Provider: `sqlite` (works for both better-sqlite3 dev and libSQL/Turso prod)
- Generated client output: `src/generated/prisma/` (imported via `@/lib/db` re-export)

### Running migrations

```bash
# Dev — create + apply migration
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name <descriptive_name>

# Re-generate client only
DATABASE_URL="file:./dev.db" npx prisma generate

# Prod (Vercel build pipeline auto-runs `prisma generate && next build`)
DATABASE_URL=$TURSO_DATABASE_URL npx prisma migrate deploy
```

### Schema conventions

| Pattern | Example | Why |
|---|---|---|
| `cuid()` IDs | `id String @id @default(cuid())` | Short, sortable, no PostgreSQL UUID extension needed |
| Timestamps | `createdAt DateTime @default(now())` + optional `updatedAt DateTime @updatedAt` | |
| Cascade on dependent rels | `onDelete: Cascade` on Vote → Ticket, Ticket → Project | Avoid orphans |
| Composite unique | `@@unique([userId, ticketId])` on Vote | Prevent duplicate votes |
| TTL field | `expiresAt DateTime?` | Nullable means "no expiry" |
| Soft enum | `String` with `// "DEV" | "QA" | "BA" | null` comment + Zod-like validator in lib | SQLite lacks native enums |

**Mandatory:** every new model that holds user data must consider:
- Whom does it belong to? (FK to `User` / `Project`)
- Should it cascade delete?
- Does it have a TTL?
- Composite unique constraints?

---

## 6. Validation

We don't use Zod / Yup. **Input validation is inline at the action/route boundary**, returning `{ error: t("key") }`.

Pattern (from `estimation.ts`):

```ts
const VALID_DEV_EFFORT = [1, 2, 4, 6];
const devEffort = parseInt(formData.get("devEffort") as string);
if (!VALID_DEV_EFFORT.includes(devEffort)) {
  return { error: t("invalidCriteriaValues") };
}
```

For complex shapes, write a small `isXxx` type guard in `src/lib/<feature>.ts`. Example: `isEstimationMethod` in `src/lib/estimation-engine.ts`.

**Trust nothing from the client.** Even if the UI restricts choices, the server must re-validate.

---

## 7. Error Handling

| Layer | Pattern |
|---|---|
| Server Action | Return `{ error: t("errorKey") }`. Never throw. |
| GET API Route | `return NextResponse.json({ error: "..." }, { status: N })` + `console.error("[GET /api/path] Error:", e)` |
| Permission check helper | May `throw new Error(t("..."))` — the action catches via try wrapper |
| Prisma error (unique violation, FK violation) | Catch by `error.code === "P2002"` etc. and translate to `{ error: t("...") }` |

**Frontend mapping:** the client UI displays `result.error` directly (it's already translated). Never expose internal stack traces.

---

## 8. Real-Time (Polling, not WebSocket)

**This project deliberately uses HTTP polling, not SSE or WebSocket.** Reasons:
- Vercel hobby tier has no persistent connections
- Polling state is simpler to reason about and debug
- 5-second latency is acceptable for planning poker

### Hook
- `src/hooks/use-estimation-polling.ts` — polls `/api/estimation/session` every 5s
- `src/hooks/use-board-polling.ts` — polls `/api/board/state` (Gantt)
- `src/hooks/use-estimation-notification.ts` — polls `/api/estimation/active` every 3s for global notifications

### When adding a new real-time feature
1. Add fields to the relevant `/api/.../route.ts` response (don't create a new endpoint)
2. Add fields to the relevant hook's TS interface
3. In the client component, compare new value vs `useRef` of previous to detect changes (e.g. method change toast in `quick-room-board.tsx`)

### Optimistic UI
For mutations whose result the polling will eventually reflect, mirror state locally first, then call action, then `refresh()`:

```tsx
const handleSubmit = () => {
  setOptimistic(next);                    // local
  startTransition(async () => {
    await someAction();                   // server
    onRefresh?.();                        // poll catches up
  });
};
```

See `ShowDistributionToggle` in `vote-details.tsx`.

---

## 9. Scheduled Jobs — Vercel Cron

- **Config:** `vercel.json` → `crons` array
- **Endpoint:** `src/app/api/cron/<job>/route.ts`
- **Auth:** check `Authorization: Bearer ${CRON_SECRET}` header in production (Vercel injects automatically)

Pattern (from `src/app/api/cron/cleanup-expired/route.ts`):

```ts
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.CRON_SECRET;
    const auth = request.headers.get("authorization");
    if (secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ... do the work
  return NextResponse.json({ success: true, ... });
}
```

**Rule:** lazy cleanup on read remains the primary defense. Cron is a fallback. If you add a new TTL'd entity, add cleanup logic in both places.

---

## 10. Cleanup & Cascading Deletes

When a top-level entity is deleted (e.g. a Quick Room), the cascade order matters because SQLite doesn't enforce FK constraints by default in our schema for everything. The existing cleanup transaction in `cleanup-expired/route.ts` shows the order:

```ts
await prisma.$transaction(async (tx) => {
  // 1. Votes (depend on Ticket)
  // 2. EstimationSession (depends on Project)
  // 3. Tickets (depend on Project)
  // 4. InviteLinks (depend on Project)
  // 5. SpScaleItems (depend on Project)
  // 6. ProjectMember (depends on Project + User)
  // 7. Project itself
  // 8. Orphan guest Users
});
```

Always delete from leaf → root in a `$transaction`.

---

## 11. i18n in Server-side Code

Errors and any string-producing server code MUST go through `next-intl`:

```ts
import { getTranslations } from "next-intl/server";
const t = await getTranslations("errors");
return { error: t("nickTaken") };
```

When adding a new error message:
1. Add a key to `messages/<lang>.json` under the `"errors"` namespace
2. Add the same key to **all 7 languages** (ru/en/pl/es/be/uk/hi)
3. Validate JSON: `for f in messages/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f', 'utf8'))"; done`

---

## 12. Logging

We use `console.error` and `console.warn` only — no structured logging library. Format:

```ts
console.error("[GET /api/estimation/session] Error:", e);
console.warn("[cron cleanup-expired] No expired rooms found");
```

**Rule:** prefix with the file path or feature name in square brackets. Helps when grepping Vercel logs.

**Don't log:** passwords, password hashes, full request bodies, PII beyond ID/nickname.

---

## 13. Production Hardening

Already in place:
- `httpOnly` + `Secure` (in prod) + `SameSite=Lax` cookies (`src/lib/session.ts`)
- bcrypt for password hashing (`src/lib/password.ts`)
- HTTPS enforced by Vercel
- Proxy middleware blocks unauthenticated routes (`src/proxy.ts`)
- Cron with `CRON_SECRET` (env)

Still required when shipping anything new:
- [ ] Input validation on every Server Action and API route
- [ ] Authorization check (membership, ownership) before any DB read/write of user data
- [ ] No `console.log` left behind
- [ ] No new dependencies without explicit reason — `package.json` is curated
- [ ] Migrations are forward-compatible (no destructive changes without explicit user approval)

---

## 14. Build & Verify

Before claiming completion:

```bash
# Generate Prisma client + build
DATABASE_URL="file:./dev.db" npm run build

# Lint
npm run lint
```

Pre-existing lint errors are not yours; new ones are. Build must be clean (zero errors).

---

## 15. Anti-Patterns

| ❌ Don't | ✅ Do |
|---|---|
| Throw from Server Actions to surface errors | Return `{ error }` |
| Add WebSocket / SSE | Extend the existing polling response |
| Hard-code English error strings | `getTranslations("errors")` |
| Add Redis / queue | Lazy + Cron is enough for this scale |
| Add new auth scheme (JWT, OAuth) | Stick with httpOnly cookie session |
| Use `gray-*` Tailwind colors in backend-rendered HTML (e.g. legal pages) | `zinc-*` |
| Use `prisma.x.findUnique` with `where: { name }` for User | `findFirst({ where: { name, isGuest: false } })` — name is no longer unique |
| Hard-code `MIN_AGE`, controller email, app name | Import from `@/lib/legal` |
| Use `process.env.X` directly outside `src/lib/db.ts`, `src/lib/session.ts`, cron route, `next.config.ts` | Wrap in a config helper if you need a new env var |

---

## 16. References

| Need | File |
|---|---|
| Project stack quick reference (versions, files) | [references/project-stack.md](references/project-stack.md) |
| Server Action template + checklist | [references/server-actions.md](references/server-actions.md) |
| Prisma schema patterns from this codebase | [references/prisma-patterns.md](references/prisma-patterns.md) |
| Auth & session flow diagrams | [references/auth-flow.md](references/auth-flow.md) |
| Release checklist (pre-deploy + post-deploy) | [references/release-checklist.md](references/release-checklist.md) |
