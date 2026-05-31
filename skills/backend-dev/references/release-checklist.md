# Release Checklist

Run before merging to main / deploying to Vercel.

## 1. Build & Lint

```bash
DATABASE_URL="file:./dev.db" npm run build
npm run lint
```

- [ ] Build exits with `✓ Compiled successfully` and lists all routes
- [ ] Lint reports no NEW errors (pre-existing ones are not yours to fix)
- [ ] Prisma client regenerated (`prisma generate` runs as part of build)

## 2. Schema & Migrations

- [ ] If `prisma/schema.prisma` changed → there's a corresponding migration in `prisma/migrations/<timestamp>_<name>/migration.sql`
- [ ] Migration file is committed
- [ ] Migration is **non-destructive** (no dropped columns / tables without a separate explicit migration that the user approved)
- [ ] If you renamed `User.x` or similar, check **all** uses across `src/` (especially `prisma/seed.ts`, server actions, API routes)

## 3. i18n

- [ ] New keys added to **all 7** `messages/<lang>.json` files (ru, en, pl, es, be, uk, hi)
- [ ] JSON files valid:
  ```bash
  for f in messages/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f', 'utf8'))" && echo "OK $f"; done
  ```
- [ ] No hard-coded UI strings introduced in new code

## 4. Auth & Access Control

- [ ] Every new Server Action calls `requireUser` / `requireProjectMember` / `requireProjectSM` (or an equivalent existing guard)
- [ ] Every new GET API route checks `getSession()` and authorization (membership, ownership)
- [ ] Every new public route is added to `PUBLIC_PATHS` in `src/proxy.ts`
- [ ] Cron route checks `CRON_SECRET` in production

## 5. Data Privacy

- [ ] No new PII columns added without considering retention
- [ ] No new logging of passwords / hashes / tokens
- [ ] If new entity has a TTL, lazy cleanup is wired (in read paths) AND cron handles batch cleanup
- [ ] If new feature collects user data, Privacy Policy (`src/app/privacy/page.tsx`) reflects it

## 6. Legal & Brand

- [ ] No hard-coded `APP_NAME`, `CONTROLLER_NAME`, `CONTACT_EMAIL`, `MIN_AGE` — import from `@/lib/legal`
- [ ] If new entry point creates an account or session, consent UX is present (checkbox on auth forms, browse-wrap on guest forms)
- [ ] Public pages include `<Footer />`

## 7. Real-time / Polling

- [ ] If extending an existing polling response — TS interface in the hook updated to match
- [ ] If adding a new polling endpoint — `export const dynamic = "force-dynamic"` is set
- [ ] Polling interval consistent with existing (5s normal, 3s for active-ticket notifications)
- [ ] Aggregated all needed data into one response (don't make the client poll multiple endpoints)

## 8. Error Handling

- [ ] Actions return `{ error: t("key") }` instead of throwing
- [ ] API routes return `NextResponse.json({ error }, { status })` instead of throwing
- [ ] `console.error("[<route>] ...", e)` for unexpected errors
- [ ] No raw stack traces or Prisma errors exposed to client

## 9. Environment Variables

- [ ] New env vars documented in this file or `references/project-stack.md`
- [ ] `.env` and `.env.local` remain gitignored
- [ ] No secrets committed

## 10. Smoke Test (dev)

```bash
npm run dev    # http://localhost:6969
```

- [ ] Landing loads, both CTAs (Quick Poker / Sprint Planner) work
- [ ] Register flow: name + password + consent checkbox → home
- [ ] Login flow works
- [ ] `/poker` create a Quick Room as guest → enter as host → invite link works in another browser session
- [ ] Estimation flow: create ticket → vote → reveal → accept
- [ ] Settings: change estimation method → form reflects new method via polling
- [ ] /terms, /privacy, /cookies render with the expected controller info from `lib/legal.ts`
- [ ] 404: visit `/whatever-doesnt-exist` → custom not-found page

## 11. Vercel Deploy Verification

After deploying:

- [ ] `https://<app>.vercel.app/` loads
- [ ] Cron is configured and `CRON_SECRET` set in Vercel env vars
- [ ] `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` set in Vercel
- [ ] First user can register
- [ ] One full Quick Poker round end-to-end with two browser sessions

## 12. Rollback Plan

If a deploy regresses:

1. Vercel → Deployments → previous deployment → "Promote to Production"
2. If a migration was applied, you may need to manually revert by writing a new migration that undoes the change (Prisma migrations are forward-only)
3. Communicate to active users (no email infra — accept downtime)

## 13. Changelog

- [ ] Updated `docs/changelog.md` with the dated entry following the existing style
- [ ] If new epic / major change, updated `docs/features/epic-X.md`

---

**Pre-existing known issues (not yours to fix):**
- Lint: a handful of `set-state-in-effect` warnings in `gantt-header.tsx`, `use-estimation-notification.ts`. Track but don't block.

When in doubt: re-read `docs/changelog.md` for the most recent release pattern, mimic it.
