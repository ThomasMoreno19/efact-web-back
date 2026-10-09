CREATE TABLE `cliente` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_empresa` INTEGER NOT NULL,
  `cuil` VARCHAR(30) NULL,
  `nombre` VARCHAR(150) NULL,
  INDEX `cliente_id_empresa_index` (`id_empresa`),
  PRIMARY KEY (`id`, `id_empresa`),
  CONSTRAINT `cliente_id_empresa_foreign`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
