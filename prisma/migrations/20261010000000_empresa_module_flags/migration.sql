ALTER TABLE `empresa`
  ADD COLUMN `catalogo_habilitado` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `saldos_habilitados` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `reparaciones_habilitadas` BOOLEAN NOT NULL DEFAULT false;

UPDATE `empresa`
SET `catalogo_habilitado` = `tieneCarrito`;
