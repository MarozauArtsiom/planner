import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  console.log("[db] ENV check:", {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "SET" : "UNSET",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "UNSET",
    NODE_ENV: process.env.NODE_ENV,
  });

  if (process.env.TURSO_DATABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client");
    const adapter = new PrismaLibSql(createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }));
    // @ts-expect-error Prisma 7.x query engine validates datasourceUrl even with adapter
    return new PrismaClient({ adapter, datasourceUrl: process.env.TURSO_DATABASE_URL });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  // @ts-expect-error Prisma 7.x query engine validates datasourceUrl even with adapter
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }), datasourceUrl: url });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
