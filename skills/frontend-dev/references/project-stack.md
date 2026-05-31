# Project Stack — Quick Reference

## Runtime

| | |
|---|---|
| Node | 20+ (Next 16 requirement) |
| Package manager | npm |
| Dev port | `npm run dev` → `http://localhost:6969` |

## Dependencies (from `package.json`)

| Package | Version | Use |
|---|---|---|
| `next` | 16.1.6 | App Router + Turbopack |
| `react`, `react-dom` | 19.2.3 | React 19 features (useActionState, async params) |
| `typescript` | ^5 | Strict mode |
| `tailwindcss` + `@tailwindcss/postcss` | ^4 | v4 syntax (`@import "tailwindcss"`) |
| `next-intl` | ^4.8.3 | i18n (7 langs), cookie locale |
| `@prisma/client`, `prisma` | ^7.5.0 | ORM |
| `@prisma/adapter-libsql`, `@libsql/client` | ^7.5.0 / ^0.17.0 | Turso (prod) |
| `@prisma/adapter-better-sqlite3`, `better-sqlite3` | ^7.5.0 / ^12.6.2 | dev DB |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `zustand` | ^5.0.11 | Client state stores |
| `@dnd-kit/core`, `@dnd-kit/sortable` | ^6.3.1 | Drag-and-drop (Gantt) |
| `jspdf`, `jspdf-autotable` | ^4.2.0 / ^5.0.7 | PDF export (sprint reports) |
| `papaparse` | ^5.5.3 | CSV import |
| `qrcode` | ^1.5.4 | QR codes for Quick Rooms |
| `date-fns` | ^4.1.0 | Date utilities |

**Forbidden additions** (not aligned with project philosophy):
- Icon libraries (`@heroicons/react`, `lucide-react`, etc.) — we inline SVG
- Animation libraries (Framer Motion, GSAP) — CSS only
- Form libraries (react-hook-form, formik) — native FormData + useTransition is enough
- Component libraries (shadcn/ui, MUI) — we hand-roll with Tailwind
- Analytics / tracking — privacy-first stance

## App Router Conventions (Next.js 16)

| Convention | Note |
|---|---|
| `params` is async | `const { id } = await params;` in pages |
| Server Components default | Add `"use client"` to leaves only |
| Server Actions in `src/app/actions/*.ts` | `"use server"` at file top |
| Route Handlers in `src/app/api/**/route.ts` | `export async function GET/POST/...` |
| Middleware at `src/proxy.ts` | (named `proxy.ts` here, not `middleware.ts`) |
| Metadata: `export const metadata: Metadata = { ... }` | Per-page or in `layout.tsx` |

## Database (dev vs prod)

| | Dev | Prod |
|---|---|---|
| Provider | SQLite (`file:./dev.db`) | Turso (libSQL) |
| Adapter | `@prisma/adapter-better-sqlite3` | `@prisma/adapter-libsql` |
| Config | `DATABASE_URL` env | `TURSO_DATABASE_URL` env |
| Branch | `src/lib/db.ts` picks at runtime | |

## Deployment

- **Vercel** (hobby tier). Build: `prisma generate && next build`
- **Vercel Cron** (`vercel.json`): hourly `/api/cron/cleanup-expired`
- **CRON_SECRET** env var required in prod

## Files You Often Touch

| Task | File(s) |
|---|---|
| New i18n string | `messages/{ru,en,pl,es,be,uk,hi}.json` |
| New UI page | `src/app/<route>/page.tsx` + sibling client components |
| New mutation | `src/app/actions/<feature>.ts` |
| New polling endpoint or extend existing | `src/app/api/<area>/route.ts` |
| New schema field | `prisma/schema.prisma` + `prisma migrate dev --name ...` |
| New legal text or app constant | `src/lib/legal.ts` |
