ALTER TABLE `usuario`
MODIFY `role` ENUM('Superadmin', 'Admin', 'Interno', 'Externo') NOT NULL DEFAULT 'Admin';
