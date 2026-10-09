ALTER TABLE `cliente`
  ADD COLUMN `updated_at` DATETIME(0) NULL,
  DROP COLUMN `fecha_saldo`;
