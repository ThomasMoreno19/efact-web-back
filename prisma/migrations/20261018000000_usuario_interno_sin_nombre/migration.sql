ALTER TABLE `usuario`
MODIFY `nombre` VARCHAR(255) NULL;

UPDATE `usuario`
SET `nombre` = NULL
WHERE `role` = 'Interno';
