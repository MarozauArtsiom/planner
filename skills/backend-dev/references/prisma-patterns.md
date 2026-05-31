# Prisma Patterns — From the Existing Schema

## Schema File

`prisma/schema.prisma` — single file, all models in one place. Models live at the same indentation; SQLite-compatible types only (no `Decimal`, no native enums, no JSON columns).

## ID & Timestamps

```prisma
model X {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt    // optional; add only if you actually update
}
```

`cuid()` is preferred over `uuid()` (shorter, monotonic). Don't mix.

## Nullable vs Optional

- `String?`, `Int?`, `DateTime?` = nullable in DB
- Used heavily for **soft state** (`expiresAt?` = no expiry if null; `singleValue?` = not set yet)

## Soft Enums

SQLite lacks native enums. Convention: store as `String` with a comment listing valid values, and add a runtime type guard in `src/lib/<feature>.ts`.

```prisma
model Project {
  estimationMethod String @default("COMPOSITE_SP")
  // "COMPOSITE_SP" | "FIBONACCI_SP" | "HOURS" | "DAYS"
}
```

```ts
// src/lib/estimation-engine.ts
export type EstimationMethod = "COMPOSITE_SP" | "FIBONACCI_SP" | "HOURS" | "DAYS";
export function isEstimationMethod(v: unknown): v is EstimationMethod {
  return v === "COMPOSITE_SP" || v === "FIBONACCI_SP" || v === "HOURS" || v === "DAYS";
}
```

Use the guard in actions/routes before persisting.

## Relations & Cascades

```prisma
model Vote {
  ticketId String
  ticket   Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, ticketId])
}
```

- `onDelete: Cascade` on dependent rows (Vote depends on Ticket; ProjectMember depends on Project)
- Composite unique with `@@unique` (Vote per user+ticket; ProjectMember per user+project)

**SQLite reality:** cascades work, but cleanup of multi-level deletes (e.g. Quick Room → Project + dependent rows) is safer to do explicitly in a `$transaction`. See `cleanup-expired/route.ts`.

## TTL Pattern

Two fields:

```prisma
model Project {
  expiresAt DateTime?   // null = never expires (regular projects)
}

model User {
  isGuest   Boolean   @default(false)
  expiresAt DateTime?
}
```

Helper for checking:

```ts
// src/lib/quick-room.ts
export function isQuickRoomExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() < Date.now();
}
```

Lazy cleanup happens at read time (`findActiveQuickRoom` returns null if expired). Background cleanup via cron.

## Migrations

```bash
# 1. Edit prisma/schema.prisma
# 2. Generate + apply migration in dev:
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name describe_the_change

# 3. Commit the generated SQL in prisma/migrations/<timestamp>_<name>/migration.sql

# 4. In prod (Vercel build), `prisma generate` runs automatically; for migrate deploy:
DATABASE_URL=$TURSO_DATABASE_URL npx prisma migrate deploy
```

**Migration naming:** descriptive snake_case. Examples from history:
- `20260313145856_init`
- `20260314181724_add_estimation_fields`
- `20260526180821_add_estimation_method`
- `20260528212850_add_quick_rooms`
- `20260531104640_add_show_distribution_flag`

**Never** edit a previously-applied migration. To fix it: create a new migration that corrects state.

## Common Query Patterns

### Find by composite unique

```ts
await prisma.projectMember.findUnique({
  where: { userId_projectId: { userId, projectId } },
});
```

### Upsert (insert or update)

```ts
await prisma.vote.upsert({
  where: { userId_ticketId: { userId: user.id, ticketId: session.activeTicketId } },
  create: { userId: user.id, ticketId, singleValue },
  update: { singleValue },
});
```

### `findFirst` with non-unique field

After we removed `@unique` from `User.name` (to allow duplicate guest names), login/register switched from `findUnique` to:

```ts
const user = await prisma.user.findFirst({
  where: { name, isGuest: false },
});
```

### Aggregate in one round-trip for polling

```ts
const [project, session, votes, tickets, scale] = await Promise.all([
  prisma.project.findUnique({ where: { id: projectId } }),
  prisma.estimationSession.findFirst({ where: { projectId }, orderBy: { createdAt: "desc" } }),
  prisma.vote.findMany({ where: { ticketId: session?.activeTicketId } }),
  prisma.ticket.findMany({ where: { projectId } }),
  prisma.spScaleItem.findMany({ where: { projectId }, orderBy: { value: "asc" } }),
]);
```

For the polling endpoint, `Promise.all` + minimum needed `select`/`include` is the pattern.

### Avoid N+1

```ts
// ❌ N queries
const projects = await prisma.project.findMany();
for (const p of projects) {
  p.members = await prisma.projectMember.findMany({ where: { projectId: p.id } });
}

// ✅ One query with relations
const projects = await prisma.project.findMany({
  include: {
    members: { include: { user: { select: { id: true, name: true } } } },
  },
});
```

### Transaction for multi-step

```ts
await prisma.$transaction(async (tx) => {
  await tx.vote.deleteMany({ where: { ticketId } });
  await tx.estimationSession.update({
    where: { id: sessionId },
    data: { status: "VOTING" },
  });
});
```

## Select vs Include

- `include: { relation: true }` — full row of the related model
- `include: { relation: { select: { id: true, name: true } } }` — only some fields
- `select: { ... }` — explicit projection of the parent model (use when you want a subset)

**Performance rule:** never `include` unbounded one-to-many relations on hot polling endpoints unless you also `take: N`.

## Connection in dev/prod

`src/lib/db.ts` is the only place that constructs `PrismaClient`. Use the exported `prisma` everywhere.

```ts
import { prisma } from "@/lib/db";
```

Never `new PrismaClient()` elsewhere — would open extra connections.

## Type Imports

Generated types live in `src/generated/prisma/`. Import from there:

```ts
import type { Project, User, Vote } from "@/generated/prisma";
```

Useful for service-layer helpers that don't take a full `prisma.x.findMany()` result.

## When to Add a New Model

Decision matrix:

| Question | Action |
|---|---|
| Is it a new core entity (something users CRUD)? | New model |
| Is it a denormalized summary / cache? | Don't add a model; compute on read |
| Is it one-to-one extension of an existing model? | Add fields to the existing model |
| Is it a soft enum? | `String` field + type guard, no model |
| Is it ephemeral (24h)? | Add `expiresAt`, plan lazy + cron cleanup |
