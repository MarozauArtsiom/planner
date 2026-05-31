# Auth & Session — Flow

## Mechanism

**httpOnly cookie session** — no JWT, no third-party identity, no refresh tokens. Designed for simplicity and Vercel-friendly stateless requests where each request reads the cookie.

## Cookie

| Property | Value |
|---|---|
| Name | `userId` |
| Value | Prisma `User.id` (cuid) |
| httpOnly | `true` (not accessible to JS) |
| Secure | `true` in prod, `false` in dev |
| SameSite | `Lax` (allows top-level navigation cross-site, blocks CSRF on POST) |
| MaxAge | `60 * 60 * 24 * 365` (1 year) |
| Path | `/` |

Implementation: `src/lib/session.ts`.

## Files

| File | Purpose |
|---|---|
| `src/lib/session.ts` | `getSession() / setSession(userId) / clearSession()` |
| `src/lib/password.ts` | `hashPassword(plain)` / `verifyPassword(plain, hash)` (bcrypt) |
| `src/lib/current-user.ts` | `getCurrentUser()` — returns User row or null |
| `src/lib/permissions.ts` | `hasSmRights(userId, membership, project)` |
| `src/app/actions/auth.ts` | `register`, `login`, `logout` actions |
| `src/proxy.ts` | Middleware: redirect unauthenticated users to `/login` |

## Register Flow

```
1. User submits /register form with name + password + agreed checkbox
2. Server action `register(formData)`:
   a. Validate: name length >= 2, password >= 4 chars
   b. findFirst({ where: { name, isGuest: false } }) — check not taken
   c. bcrypt.hash(password)
   d. prisma.user.create({ name, passwordHash })
   e. setSession(user.id)  → httpOnly cookie set
   f. redirect(redirectTo)
```

Note: `User.name` is NOT `@unique` in the schema (because guests may have duplicate names). The `isGuest: false` filter enforces uniqueness for real accounts only.

## Login Flow

```
1. /login form → action `login(formData)`
2. findFirst({ where: { name, isGuest: false } })
3. If !user || !user.passwordHash → invalid credentials error
4. bcrypt.compare(password, user.passwordHash)
5. If valid → setSession(user.id) → redirect
```

## Logout

```
1. action `logout()` → clearSession() → redirect("/login")
```

## Guest Flow (Quick Rooms)

```
1. User opens /poker → no session
2. Enters nickname → action `createQuickRoom`:
   a. getSession() returns null
   b. Create User { name, passwordHash: null, isGuest: true, expiresAt: now+24h }
   c. setSession(user.id)  → guest now has a session
   d. Create Project { isQuick: true, accessCode, expiresAt, ownerId: user.id }
   e. Create ProjectMember { userId, projectId, isScrumMaster: true }
   f. redirect(`/poker/${accessCode}`)
```

When a guest leaves (`leaveQuickRoom`), if they have no other ProjectMember rows, their User row is deleted and `clearSession()` removes the cookie.

## Middleware (proxy.ts)

```ts
const PUBLIC_PATHS = ["/login", "/register", "/invite", "/poker", "/terms", "/privacy", "/cookies"];
const LANDING_PATH = "/";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === LANDING_PATH) return NextResponse.next();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const userId = request.cookies.get("userId")?.value;
  if (!userId) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}
```

**Important:**
- File is `src/proxy.ts` (not `src/middleware.ts`). The `config.matcher` is unchanged from the Next.js default.
- API routes (`/api/...`) are excluded from the matcher — auth is re-checked inside each route handler.
- When adding a new public route, add it to `PUBLIC_PATHS` here.

## Authorization (RBAC)

There is no global RBAC. Authorization is **per-project**, via `ProjectMember`.

| Capability | Check |
|---|---|
| Read project data | `ProjectMember` exists |
| Write team-role data (votes, etc.) | `ProjectMember.role !== null` (DEV/QA/BA) |
| Manage project (settings, tickets, sprints) | `hasSmRights(userId, membership, project)` |

```ts
// src/lib/permissions.ts
export function hasSmRights(
  userId: string,
  membership: { isScrumMaster: boolean } | null,
  project: { ownerId: string } | null,
): boolean {
  if (!membership || !project) return false;
  return project.ownerId === userId || membership.isScrumMaster;
}
```

**Quick Rooms:** SM concept replaced by "host" = `project.ownerId === userId`. `requireProjectSM` in `estimation.ts` branches on `project.isQuick`.

## Cron Auth

`src/app/api/cron/cleanup-expired/route.ts`:

```ts
if (process.env.NODE_ENV === "production") {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>` to cron-invoked requests when the env var is set.

## Common Mistakes

| ❌ Don't | ✅ Do |
|---|---|
| Read `process.env.SESSION_SECRET` directly | The cookie has no signature; we trust httpOnly + Secure |
| Read `userId` cookie manually from request | Use `await getSession()` |
| Add auth to a new GET API route by hand | Copy the pattern: `const userId = await getSession(); if (!userId) return 401` |
| Forget to add new public route to `PUBLIC_PATHS` | Always update `src/proxy.ts` when adding `/foo` that should be reachable without login |
| Use `findUnique({ where: { name } })` on User | `findFirst({ where: { name, isGuest: false } })` — name is no longer unique |
| Reset session on every action call | Set session only on login/register/guest-create |
| Trust `request.body.userId` from client | Always derive userId from cookie |

## When Auth Model Changes

If you ever consider adding (don't unless explicitly requested):

- **OAuth / SSO** — would require a new column on User, callback routes, and provider config
- **Email + magic link** — would require `User.email` column (currently we don't store email), an email service, and link signing
- **2FA** — would require TOTP secret column, verification step at login

All of the above are **out of scope** for this project's stated philosophy of minimal data collection.
