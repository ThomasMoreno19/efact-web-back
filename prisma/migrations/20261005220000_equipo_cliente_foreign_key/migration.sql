-- Existing equipment has no inferred client. Keep the relation nullable and
-- do not rewrite the customer snapshots stored in historical movements.
ALTER TABLE `equipo`
  ADD COLUMN `cuil` VARCHAR(30) NULL,
  ADD INDEX `equipo_cuil_id_empresa_index` (`cuil`, `id_empresa`);

ALTER TABLE `equipo`
  ADD CONSTRAINT `equipo_cuil_id_empresa_foreign`
  FOREIGN KEY (`cuil`, `id_empresa`)
  REFERENCES `cliente` (`cuil`, `id_empresa`)
  ON DELETE RESTRICT ON UPDATE NO ACTION;
