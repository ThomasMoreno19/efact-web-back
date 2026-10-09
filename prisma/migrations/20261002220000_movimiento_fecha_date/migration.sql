-- Legacy movement dates are calendar dates formatted as D/M/YYYY; blank
-- strings represent missing dates and become NULL.
ALTER TABLE `movimiento`
  ADD COLUMN `fecha_date` DATE NULL;

UPDATE `movimiento`
SET `fecha_date` = STR_TO_DATE(NULLIF(TRIM(`fecha`), ''), '%e/%c/%Y');

ALTER TABLE `movimiento`
  DROP COLUMN `fecha`,
  CHANGE COLUMN `fecha_date` `fecha` DATE NULL;
