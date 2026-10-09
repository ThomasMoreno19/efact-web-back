-- The legacy values are calendar dates formatted as D/M/YYYY; blank strings
-- represent missing dates and become NULL.
ALTER TABLE `equipo`
  ADD COLUMN `created_at` DATE NULL;

UPDATE `equipo`
SET `created_at` = STR_TO_DATE(NULLIF(TRIM(`fecha_creacion`), ''), '%e/%c/%Y');

ALTER TABLE `equipo`
  DROP COLUMN `fecha_creacion`;
