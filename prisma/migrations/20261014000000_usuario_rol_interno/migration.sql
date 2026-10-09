ALTER TABLE `usuario`
MODIFY `role` ENUM('Superadmin', 'Admin', 'Interno') NOT NULL DEFAULT 'Admin';

ALTER TABLE `usuario`
ADD INDEX `usuario_id_empresa_index` (`id_empresa`);

ALTER TABLE `usuario`
DROP INDEX `usuario_id_empresa_unique`;
