-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "devEffortProportion" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EstimationSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'VOTING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sprintId" TEXT,
    "activeTicketId" TEXT,
    CONSTRAINT "EstimationSession_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EstimationSession_activeTicketId_fkey" FOREIGN KEY ("activeTicketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EstimationSession" ("activeTicketId", "createdAt", "id", "sprintId", "status", "updatedAt") SELECT "activeTicketId", "createdAt", "id", "sprintId", "status", "updatedAt" FROM "EstimationSession";
DROP TABLE "EstimationSession";
ALTER TABLE "new_EstimationSession" RENAME TO "EstimationSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
