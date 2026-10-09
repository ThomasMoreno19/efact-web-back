-- The legacy DATE represented an Argentina calendar day. Store its midnight as
-- a UTC instant so API consumers can render it in America/Argentina/Buenos_Aires.
ALTER TABLE `empresa`
  CHANGE COLUMN `fecha_creacion` `created_at` DATETIME(0) NULL;

-- Preserve the original Argentina date (UTC-03:00) for existing non-NULL rows.
UPDATE `empresa`
SET `created_at` = DATE_ADD(`created_at`, INTERVAL 3 HOUR)
WHERE `created_at` IS NOT NULL;

-- Fill missing legacy dates with the current instant, independent of the
-- timezone configured by phpMyAdmin or the hosting database server.
UPDATE `empresa`
SET `created_at` = UTC_TIMESTAMP(0)
WHERE `created_at` IS NULL;

ALTER TABLE `empresa`
  MODIFY COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- Historical update times are unknown; Prisma will populate this on writes.
ALTER TABLE `empresa`
  ADD COLUMN `updated_at` DATETIME(0) NULL;
