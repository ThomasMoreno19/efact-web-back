ALTER TABLE `empresa`
  ADD COLUMN `slug` VARCHAR(100) NOT NULL,
  ADD UNIQUE INDEX `empresa_slug_unique` (`slug`);
