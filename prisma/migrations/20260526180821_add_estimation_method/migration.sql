-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sprintDurationWeeks" INTEGER NOT NULL DEFAULT 1,
    "sprintStartDay" INTEGER NOT NULL DEFAULT 3,
    "sprintNameTemplate" TEXT NOT NULL DEFAULT 'Sprint {number}',
    "taskCoefficient" REAL NOT NULL DEFAULT 1.0,
    "estimationMethod" TEXT NOT NULL DEFAULT 'COMPOSITE_SP',
    "workingHoursPerDay" INTEGER NOT NULL DEFAULT 8,
    "ownerId" TEXT NOT NULL,
    "activeSprintId" TEXT,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_activeSprintId_fkey" FOREIGN KEY ("activeSprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("activeSprintId", "createdAt", "id", "name", "ownerId", "sprintDurationWeeks", "sprintNameTemplate", "sprintStartDay", "taskCoefficient") SELECT "activeSprintId", "createdAt", "id", "name", "ownerId", "sprintDurationWeeks", "sprintNameTemplate", "sprintStartDay", "taskCoefficient" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "devEffort" INTEGER,
    "qaEffort" INTEGER,
    "risk" INTEGER,
    "uncertainty" INTEGER,
    "singleValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vote" ("createdAt", "devEffort", "id", "qaEffort", "risk", "ticketId", "uncertainty", "userId") SELECT "createdAt", "devEffort", "id", "qaEffort", "risk", "ticketId", "uncertainty", "userId" FROM "Vote";
DROP TABLE "Vote";
ALTER TABLE "new_Vote" RENAME TO "Vote";
CREATE UNIQUE INDEX "Vote_userId_ticketId_key" ON "Vote"("userId", "ticketId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
