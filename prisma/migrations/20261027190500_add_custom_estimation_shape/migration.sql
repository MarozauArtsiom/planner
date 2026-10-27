-- AlterTable
ALTER TABLE "Project" ADD COLUMN "customShapeJson" TEXT;

-- Backfill 0 SP for existing projects that do not have 0 in SpScaleItem yet
INSERT INTO "SpScaleItem" ("id", "projectId", "value", "label", "durationDays")
SELECT
  lower(hex(randomblob(12))),
  p."id",
  0,
  'Не требует усилий',
  1
FROM "Project" p
WHERE p."isQuick" = 0
  AND NOT EXISTS (
    SELECT 1 FROM "SpScaleItem" s WHERE s."projectId" = p."id" AND s."value" = 0
  );
