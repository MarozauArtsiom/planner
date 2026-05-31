# Server Actions — Template & Checklist

## Anatomy of a Server Action File

Path: `src/app/actions/<feature>.ts`

```ts
"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession, setSession, clearSession } from "@/lib/session";
import { hasSmRights } from "@/lib/permissions";

// ── Guards (private helpers) ──────────────────────────────

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

async function requireProjectSM(projectId: string) {
  const t = await getTranslations("errors");
  const { user, membership } = await requireProjectMember(projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, isQuick: true },
  });
  // Quick-rooms: host = owner. Regular projects: SM rights.
  if (project?.isQuick) {
    if (project.ownerId !== user.id) throw new Error(t("onlyHostAction"));
    return user;
  }
  if (!hasSmRights(user.id, membership, project)) {
    throw new Error(t("onlySmAction"));
  }
  return user;
}

// ── Public actions ─────────────────────────────────────────

export async function doSomething(projectId: string, formData: FormData) {
  const t = await getTranslations("errors");
  const { user, membership } = await requireProjectMember(projectId);

  // 1. Parse + validate inputs
  const raw = formData.get("field") as string | null;
  const value = raw?.trim();
  if (!value || value.length < 2) {
    return { error: t("invalidField") };
  }

  // 2. Mutate
  try {
    await prisma.thing.create({
      data: { value, projectId, userId: user.id },
    });
  } catch (e) {
    // Prisma unique violation, FK violation, etc.
    if (isPrismaError(e, "P2002")) {
      return { error: t("alreadyExists") };
    }
    throw e; // unexpected — let Next.js error boundary handle
  }

  return { success: true };
}

function isPrismaError(e: unknown, code: string): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === code;
}
```

## Checklist Before Submitting a New Action

- [ ] `"use server"` at the top of the file
- [ ] Reused existing guard (`requireUser`, `requireProjectMember`, `requireProjectSM`) — did not roll your own
- [ ] Parsed `FormData` with `as string | null` casts + null checks
- [ ] Validated input shape, length, allowed values BEFORE touching DB
- [ ] All error messages via `getTranslations("errors")` — no hard-coded strings
- [ ] Returned `{ success: true, ... } | { error: string }` or called `redirect()`
- [ ] No `throw` for expected user errors — only for truly unexpected ones
- [ ] Multi-step writes wrapped in `prisma.$transaction(async (tx) => { ... })`
- [ ] Added new error keys to **all 7** `messages/*.json` files
- [ ] If the action affects polled state, refresh on client via `refresh()` from the polling hook

## Multi-Step Write — Transaction Pattern

```ts
await prisma.$transaction(async (tx) => {
  // Delete dependent rows first
  await tx.vote.deleteMany({ where: { ticketId } });
  // Then mutate primary row
  await tx.estimationSession.update({
    where: { id: sessionId },
    data: { activeTicketId: null, status: "VOTING" },
  });
});
```

Used in: `changeQuickRoomMethod`, `leaveQuickRoom`, `kickFromQuickRoom`, `cleanup-expired` cron.

## When to call `redirect()` vs return `{ success }`

| Situation | Use |
|---|---|
| Mutation completes, UI stays on same page (e.g. submit vote) | `return { success: true }` + client `refresh()` |
| Mutation completes, user navigates (e.g. create project) | `redirect("/project/<id>")` |
| Unauthenticated user hits action | `redirect("/login")` (in guard) |
| Validation failure | `return { error: t("...") }` |

`redirect()` throws internally — call it at the end of the action, NOT inside a try/catch that swallows.

## Calling Actions from Client

```tsx
"use client";
import { useTransition, useState } from "react";
import { doSomething } from "@/app/actions/feature";

const [isPending, startTransition] = useTransition();
const [error, setError] = useState<string | null>(null);

const onSubmit = () => {
  startTransition(async () => {
    const fd = new FormData();
    fd.set("field", value);
    const r = await doSomething(projectId, fd);
    if (r && "error" in r) setError(r.error);
    else { onSuccess(); refresh?.(); }
  });
};
```

## Files Where Existing Actions Live

- `src/app/actions/auth.ts` — `register`, `login`, `logout`
- `src/app/actions/estimation.ts` — `submitVote`, `revealVotes`, `acceptEstimation`, `restartVoting`, `setActiveTicket`, `createTicket`, `importTickets`, `deleteTicket`, `setShowDistribution`
- `src/app/actions/project.ts` — `createProject`, `joinProject`, `createInviteLink`, `deleteInviteLink`, `updateProjectSettings`, `setActiveSprint`, `updateSpScale`, `resetSpScale`, `toggleMemberSm`, `updateMemberRole`
- `src/app/actions/quick-room.ts` — `createQuickRoom`, `joinQuickRoomAsGuest`, `startNextRound`, `changeQuickRoomMethod`, `leaveQuickRoom`, `kickFromQuickRoom`
- `src/app/actions/sprint.ts` — `createSprint`, `recalcFutureSprints`
- `src/app/actions/assignment.ts` — Gantt drag-drop actions
- `src/app/actions/timeoff.ts` — time-off CRUD
- `src/app/actions/locale.ts` — `setLocale` (writes `NEXT_LOCALE` cookie)

When adding a new feature, **prefer extending an existing file** over creating a new one. The file grows with the feature, that's fine.

## Anti-Patterns

| ❌ | ✅ |
|---|---|
| `throw new Error("Invalid input")` from action | `return { error: t("invalidInput") }` |
| Putting `await prisma.x.findMany()` inside `try { ... } catch (e) { return { error: "..." } }` for happy-path queries | Let unexpected errors bubble up; only catch known Prisma codes |
| Calling action from server component (`<form action={action}>`) without proper FormData wiring | Use client component with `useTransition` for control + error display |
| Skipping the `requireProjectMember` check because "it's a tiny action" | Always re-check; trust nothing client-side |
| Hard-coding role names (`"DEV"`, `"QA"`) without importing/typing | Define `const ROLES = ["DEV", "QA", "BA"] as const` and use the type |
| Returning `{ error: e.message }` from a caught exception (leaks internal details) | Translate to a known user-facing key, log the raw error |
