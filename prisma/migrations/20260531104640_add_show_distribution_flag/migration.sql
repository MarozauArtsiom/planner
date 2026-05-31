-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isQuick" BOOLEAN NOT NULL DEFAULT false,
    "accessCode" TEXT,
    "expiresAt" DATETIME,
    "sprintDurationWeeks" INTEGER NOT NULL DEFAULT 1,
    "sprintStartDay" INTEGER NOT NULL DEFAULT 3,
    "sprintNameTemplate" TEXT NOT NULL DEFAULT 'Sprint {number}',
    "taskCoefficient" REAL NOT NULL DEFAULT 1.0,
    "estimationMethod" TEXT NOT NULL DEFAULT 'COMPOSITE_SP',
    "workingHoursPerDay" INTEGER NOT NULL DEFAULT 8,
    "showDistributionToAll" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "activeSprintId" TEXT,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_activeSprintId_fkey" FOREIGN KEY ("activeSprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("accessCode", "activeSprintId", "createdAt", "estimationMethod", "expiresAt", "id", "isQuick", "name", "ownerId", "sprintDurationWeeks", "sprintNameTemplate", "sprintStartDay", "taskCoefficient", "workingHoursPerDay") SELECT "accessCode", "activeSprintId", "createdAt", "estimationMethod", "expiresAt", "id", "isQuick", "name", "ownerId", "sprintDurationWeeks", "sprintNameTemplate", "sprintStartDay", "taskCoefficient", "workingHoursPerDay" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_accessCode_key" ON "Project"("accessCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
