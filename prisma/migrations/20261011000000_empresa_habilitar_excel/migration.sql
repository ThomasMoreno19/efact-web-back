ALTER TABLE `empresa`
  CHANGE COLUMN `deshabilitar_excel` `habilitar_excel` BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE `empresa`
SET `habilitar_excel` = CASE WHEN `habilitar_excel` = 1 THEN 0 ELSE 1 END;
