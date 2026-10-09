UPDATE `cliente`
SET `updated_at` = DATE_SUB(`updated_at`, INTERVAL 3 HOUR)
WHERE `updated_at` IS NOT NULL;

ALTER TABLE `cliente`
  MODIFY COLUMN `updated_at` DATE NULL;
