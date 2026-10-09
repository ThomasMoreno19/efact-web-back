CREATE TABLE `ubicacion` (
  `id` INTEGER NOT NULL,
  `id_empresa` INTEGER NOT NULL,
  `descripcion` VARCHAR(50) NOT NULL,
  INDEX `fk_ubicacion_empresa` (`id_empresa`),
  PRIMARY KEY (`id`, `id_empresa`),
  CONSTRAINT `fk_ubicacion_empresa`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ubicacion` (`id`, `id_empresa`, `descripcion`)
SELECT
  ROW_NUMBER() OVER (PARTITION BY `id_empresa` ORDER BY `descripcion`),
  `id_empresa`,
  `descripcion`
FROM (
  SELECT DISTINCT `id_empresa`, `ubicacion` AS `descripcion`
  FROM `articulo`
  WHERE `ubicacion` IS NOT NULL
) AS `ubicaciones_existentes`;

ALTER TABLE `articulo`
  ADD COLUMN `id_ubicacion` INTEGER NULL;

UPDATE `articulo` AS `articulo_existente`
JOIN `ubicacion` AS `ubicacion_existente`
  ON `ubicacion_existente`.`id_empresa` = `articulo_existente`.`id_empresa`
  AND `ubicacion_existente`.`descripcion` = `articulo_existente`.`ubicacion`
SET `articulo_existente`.`id_ubicacion` = `ubicacion_existente`.`id`;

ALTER TABLE `articulo`
  DROP COLUMN `ubicacion`,
  ADD INDEX `fk_articulo_ubicacion` (`id_ubicacion`, `id_empresa`),
  ADD CONSTRAINT `fk_articulo_ubicacion`
    FOREIGN KEY (`id_ubicacion`, `id_empresa`)
    REFERENCES `ubicacion` (`id`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
