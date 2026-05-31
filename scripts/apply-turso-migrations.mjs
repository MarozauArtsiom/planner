#!/usr/bin/env node
/**
 * Apply pending Prisma migrations to Turso (libSQL) production database.
 *
 * Why this script exists:
 *   `prisma migrate deploy` uses the standard SQLite file driver and doesn't
 *   speak libSQL HTTP/WebSocket protocol. Turso requires the @libsql/client
 *   adapter. This script reads migration SQL files, applies them via libSQL
 *   client, and updates the `_prisma_migrations` ledger so Prisma stays in
 *   sync with reality.
 *
 * Usage:
 *   1. `vercel login`
 *   2. `vercel env pull .env.production.local`
 *   3. `node --env-file=.env.production.local scripts/apply-turso-migrations.mjs`
 *
 * The script is idempotent — already-applied migrations are skipped.
 */

import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const RESET = process.argv.includes("--reset");

if (!url) {
  console.error("✗ Missing TURSO_DATABASE_URL — did you run `vercel env pull .env.production.local`?");
  process.exit(1);
}

console.log(`→ Connecting to ${url.split("@").pop()?.split("?")[0]}`);
const client = createClient({ url, authToken });

// ── Optional: --reset drops all known tables before applying migrations ──────
// Use when Turso's schema drifted (e.g. _init snapshot does not match current
// migration history). This is destructive — all data is lost.
if (RESET) {
  console.log("⚠  --reset: dropping all tables before migrations");
  const knownTables = [
    "Vote",
    "TicketAssignment",
    "TimeOff",
    "EstimationSession",
    "Ticket",
    "Sprint",
    "InviteLink",
    "SpScaleItem",
    "ProjectMember",
    "Project",
    "User",
    "_prisma_migrations",
  ];
  for (const table of knownTables) {
    try {
      await client.execute(`DROP TABLE IF EXISTS "${table}"`);
      console.log(`  · dropped ${table}`);
    } catch (e) {
      console.warn(`  ! could not drop ${table}:`, e?.message ?? e);
    }
  }
  console.log("✓ Reset complete\n");
}

// ── Step 1: ensure _prisma_migrations ledger exists ──────────────────────────

await client.execute(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
  )
`);

// ── Step 2: find which migrations are already applied ────────────────────────

const appliedResult = await client.execute(
  "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL",
);
const applied = new Set(appliedResult.rows.map((r) => String(r.migration_name)));

// ── Step 3: list all local migrations in order ───────────────────────────────

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const allMigrations = fs
  .readdirSync(migrationsDir)
  .filter((f) => {
    const full = path.join(migrationsDir, f);
    return fs.statSync(full).isDirectory();
  })
  .sort(); // timestamp prefix gives natural order

console.log(`→ Found ${allMigrations.length} migrations locally, ${applied.size} already applied on Turso`);

// ── Step 4: apply each pending migration ─────────────────────────────────────

let appliedCount = 0;
for (const migrationName of allMigrations) {
  if (applied.has(migrationName)) {
    console.log(`  ✓ ${migrationName} (already applied)`);
    continue;
  }

  const sqlPath = path.join(migrationsDir, migrationName, "migration.sql");
  if (!fs.existsSync(sqlPath)) {
    console.log(`  · ${migrationName} (no migration.sql, skipping)`);
    continue;
  }

  const rawSql = fs.readFileSync(sqlPath, "utf-8");
  // Strip line comments (-- ...) first so they don't dominate a statement's
  // start. SQLite still tolerates inline comments, but trimming up-front lets
  // us split on `;` cleanly.
  const sqlNoComments = rawSql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = sqlNoComments
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`  → Applying ${migrationName} (${statements.length} statements)...`);

  try {
    // batch() executes inside a single transaction in libSQL
    await client.batch(statements, "write");

    // mark as applied
    const checksum = crypto.createHash("sha256").update(rawSql).digest("hex");
    await client.execute({
      sql: `INSERT INTO _prisma_migrations
              (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
            VALUES (?, ?, ?, datetime('now'), datetime('now'), 1)`,
      args: [crypto.randomUUID(), checksum, migrationName],
    });

    console.log(`  ✓ ${migrationName}`);
    appliedCount++;
  } catch (err) {
    console.error(`  ✗ ${migrationName} FAILED:`, err);
    console.error("");
    console.error("Migration aborted. Database may be in partial state.");
    console.error("Inspect Turso (e.g. via `turso db shell`) before re-running.");
    process.exit(2);
  }
}

console.log("");
if (appliedCount === 0) {
  console.log("✓ Already up to date.");
} else {
  console.log(`✓ Applied ${appliedCount} migration(s). Prod schema is now in sync.`);
}
