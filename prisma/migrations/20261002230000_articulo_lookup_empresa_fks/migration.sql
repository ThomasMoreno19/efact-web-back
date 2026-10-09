-- Replace the legacy non-unique single-column references with tenant-scoped
-- references to each lookup table's composite primary key.
ALTER TABLE `articulo`
  DROP FOREIGN KEY `fk_articulo_marca`;

ALTER TABLE `articulo`
  DROP FOREIGN KEY `fk_articulo_proveedor`;

DROP INDEX `fk_articulo_rubro` ON `articulo`;

CREATE INDEX `fk_articulo_rubro`
  ON `articulo` (`id_rubro`, `id_empresa`);

ALTER TABLE `articulo`
  ADD CONSTRAINT `fk_articulo_marca`
    FOREIGN KEY (`id_marca`, `id_empresa`)
    REFERENCES `marca` (`id`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_articulo_proveedor`
    FOREIGN KEY (`id_proveedor`, `id_empresa`)
    REFERENCES `proveedor` (`id`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_articulo_rubro`
    FOREIGN KEY (`id_rubro`, `id_empresa`)
    REFERENCES `rubro` (`id`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
