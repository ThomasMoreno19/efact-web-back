SET NAMES utf8mb4;

CREATE TABLE `empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(18) NULL,
    `ubicacion` VARCHAR(50) NULL,
    `logo_url` VARCHAR(255) NULL,
    `excel_import_token` VARCHAR(512) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,
    `tieneCarrito` BOOLEAN NOT NULL,
    `habilitar_excel` BOOLEAN NOT NULL DEFAULT true,
    `imagenesEnArticulos` BOOLEAN NOT NULL DEFAULT true,
    `incluirHorarios` BOOLEAN NOT NULL DEFAULT false,
    `pedidosFueraHorario` BOOLEAN NOT NULL DEFAULT false,
    `incluirCodigoBarra` BOOLEAN NOT NULL DEFAULT false,
    `toleranciaMinDias` INTEGER NULL,
    `toleranciaMaxDias` INTEGER NULL,
    `catalogo_habilitado` BOOLEAN NOT NULL DEFAULT false,
    `saldos_habilitados` BOOLEAN NOT NULL DEFAULT false,
    `reparaciones_habilitadas` BOOLEAN NOT NULL DEFAULT false,
    `mostrar_navegacion_paginas` BOOLEAN NOT NULL DEFAULT true,
    UNIQUE INDEX `empresa_slug_unique`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cliente` (
    `id_empresa` INTEGER NOT NULL,
    `cuil` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(150) NULL,
    `saldo` INTEGER NULL,
    `updated_at` DATE NULL,
    `contrasena` VARCHAR(255) NULL,
    `domicilio` VARCHAR(255) NULL,
    `localidad` VARCHAR(150) NULL,
    `telefonos` VARCHAR(255) NULL,
    INDEX `cliente_id_empresa_index`(`id_empresa`),
    PRIMARY KEY (`cuil`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `role` ENUM('Superadmin', 'Admin', 'Interno') NOT NULL DEFAULT 'Admin',
    `id_empresa` INTEGER NULL,
    `refresh_token` VARCHAR(255) NULL,
    UNIQUE INDEX `nombre`(`nombre`),
    INDEX `usuario_id_empresa_index`(`id_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `articulo` (
    `id` BIGINT NOT NULL,
    `codigo_interno` INTEGER NOT NULL,
    `codigo_barra` VARCHAR(20) NULL,
    `id_rubro` INTEGER NULL,
    `id_proveedor` INTEGER NULL,
    `id_marca` INTEGER NULL,
    `id_ubicacion` INTEGER NULL,
    `id_empresa` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `precio1` DECIMAL(10, 0) NULL,
    `precio2` DECIMAL(10, 0) NULL,
    `precio3` DECIMAL(10, 0) NULL,
    `no_procesado` TINYINT NOT NULL,
    `oferta` BOOLEAN NOT NULL,
    `aparece_en_csv` BOOLEAN NOT NULL,
    `logo_url` VARCHAR(255) NULL,
    `video_url` VARCHAR(255) NULL,
    `codigo_proveedor` VARCHAR(200) NULL,
    `tiene_existencia` BOOLEAN NOT NULL DEFAULT false,
    `existencia` INTEGER NOT NULL,
    `minima_existencia` INTEGER NULL,
    `maxima_existencia` INTEGER NULL,
    `abreviatura` VARCHAR(40) NULL,
    `unidad_medida` VARCHAR(100) NULL,
    `actualizado_en` DATE NULL,
    INDEX `articulo_id_empresa`(`id_empresa`),
    INDEX `fk_articulo_marca`(`id_marca`, `id_empresa`),
    INDEX `fk_articulo_proveedor`(`id_proveedor`, `id_empresa`),
    INDEX `fk_articulo_rubro`(`id_rubro`, `id_empresa`),
    INDEX `fk_articulo_ubicacion`(`id_ubicacion`, `id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `equipo` (
    `id` INTEGER UNSIGNED NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `marca` VARCHAR(150) NULL,
    `modelo` VARCHAR(150) NULL,
    `nombre_equipo` VARCHAR(150) NULL,
    `created_at` DATE NULL,
    `nro_serie` VARCHAR(100) NULL,
    `cuil` VARCHAR(30) NULL,
    INDEX `equipo_id_empresa_index`(`id_empresa`),
    INDEX `equipo_cuil_id_empresa_index`(`cuil`, `id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `externo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contrasena` VARCHAR(255) NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    INDEX `fk_externo_empresa`(`id_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `horarios_empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `dia_semana` TINYINT NOT NULL,
    `hora_apertura` TIME(0) NOT NULL,
    `hora_cierre` TIME(0) NOT NULL,
    INDEX `fk_horarios_empresa_empresa`(`id_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `interno` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contrasena` VARCHAR(255) NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    UNIQUE INDEX `uq_interno_empresa`(`id_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `marca` (
    `id` INTEGER NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `abreviatura` VARCHAR(30) NULL,
    `logo_url` VARCHAR(255) NULL,
    `aparece_en_csv` BOOLEAN NOT NULL,
    INDEX `fk_marca_empresa`(`id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `movimiento` (
    `id` INTEGER UNSIGNED NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `id_equipo` INTEGER UNSIGNED NOT NULL,
    `estado` VARCHAR(150) NULL,
    `fecha` DATE NULL,
    `observacion` TEXT NULL,
    `seen_at` DATETIME(0) NULL,
    `contrasena` VARCHAR(255) NULL,
    INDEX `movimiento_equipo_empresa_foreign`(`id_equipo`, `id_empresa`),
    INDEX `movimiento_id_empresa_index`(`id_empresa`),
    INDEX `movimiento_id_equipo_index`(`id_equipo`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `proveedor` (
    `id` INTEGER NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `abreviatura` VARCHAR(30) NULL,
    `logo_url` VARCHAR(255) NULL,
    `aparece_en_csv` BOOLEAN NOT NULL,
    INDEX `fk_proveedor_empresa`(`id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rubro` (
    `id` INTEGER NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `abreviatura` VARCHAR(30) NULL,
    `id_empresa` INTEGER NOT NULL,
    `aparece_en_csv` BOOLEAN NULL DEFAULT true,
    `logo_url` VARCHAR(255) NULL,
    INDEX `id_empresa`(`id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ubicacion` (
    `id` INTEGER NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,
    INDEX `fk_ubicacion_empresa`(`id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `cliente`
  ADD CONSTRAINT `cliente_id_empresa_foreign`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_id_empresa_foreign`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `articulo`
  ADD CONSTRAINT `articulo_id_empresa`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_articulo_marca`
    FOREIGN KEY (`id_marca`, `id_empresa`) REFERENCES `marca` (`id`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_articulo_proveedor`
    FOREIGN KEY (`id_proveedor`, `id_empresa`) REFERENCES `proveedor` (`id`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_articulo_rubro`
    FOREIGN KEY (`id_rubro`, `id_empresa`) REFERENCES `rubro` (`id`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_articulo_ubicacion`
    FOREIGN KEY (`id_ubicacion`, `id_empresa`) REFERENCES `ubicacion` (`id`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `equipo`
  ADD CONSTRAINT `equipo_id_empresa_foreign`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `equipo_cuil_id_empresa_foreign`
    FOREIGN KEY (`cuil`, `id_empresa`) REFERENCES `cliente` (`cuil`, `id_empresa`)
    ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE `externo`
  ADD CONSTRAINT `fk_externo_empresa`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `horarios_empresa`
  ADD CONSTRAINT `fk_horarios_empresa_empresa`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `interno`
  ADD CONSTRAINT `fk_interno_empresa`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `marca`
  ADD CONSTRAINT `fk_marca_empresa`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `movimiento`
  ADD CONSTRAINT `movimiento_equipo_empresa_foreign`
    FOREIGN KEY (`id_equipo`, `id_empresa`) REFERENCES `equipo` (`id`, `id_empresa`)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `movimiento_id_empresa_foreign`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `proveedor`
  ADD CONSTRAINT `fk_proveedor_empresa`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `rubro`
  ADD CONSTRAINT `Rubro_ibfk_1`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `ubicacion`
  ADD CONSTRAINT `fk_ubicacion_empresa`
    FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` BIGINT NOT NULL,
    INDEX `cache_expiration_index`(`expiration`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` BIGINT NOT NULL,
    INDEX `cache_locks_expiration_index`(`expiration`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` VARCHAR(255) NOT NULL,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    UNIQUE INDEX `failed_jobs_uuid_unique`(`uuid`),
    INDEX `failed_jobs_connection_queue_failed_at_index`(`connection`, `queue`, `failed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `total_jobs` INTEGER NOT NULL,
    `pending_jobs` INTEGER NOT NULL,
    `failed_jobs` INTEGER NOT NULL,
    `failed_job_ids` LONGTEXT NOT NULL,
    `options` MEDIUMTEXT NULL,
    `cancelled_at` INTEGER NULL,
    `created_at` INTEGER NOT NULL,
    `finished_at` INTEGER NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` SMALLINT UNSIGNED NOT NULL,
    `reserved_at` INTEGER UNSIGNED NULL,
    `available_at` INTEGER UNSIGNED NOT NULL,
    `created_at` INTEGER UNSIGNED NOT NULL,
    INDEX `jobs_queue_index`(`queue`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `migrations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INTEGER NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INTEGER NOT NULL,
    INDEX `sessions_last_activity_index`(`last_activity`),
    INDEX `sessions_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    UNIQUE INDEX `users_email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT NULL,
    `rolled_back_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_prisma_migrations`
  (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES
  (UUID(), '131f0d97cebcb56703cc056a6085974b318ecf542fdb5aac227da3760da5dd03', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 45 SECOND), '0_init', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 46 SECOND), 0),
  (UUID(), '2fcd51f653ff17326f24cd15aba136a7b57b817ca146d587401497f2ed949033', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 43 SECOND), '20261002173000_empresa_created_updated_at', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 44 SECOND), 0),
  (UUID(), '315c5343acc3e3210ee21b44ba2c1ff61c9d7c740da350264a92ded2ad2232a6', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 41 SECOND), '20261002180000_create_cliente', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 42 SECOND), 0),
  (UUID(), '42a2e4c5f9413ed09e5912df7c5d6d7702d2aff56b25ec3973eb2fd36a37bc2e', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 39 SECOND), '20261002190000_cliente_cuil_saldo', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 40 SECOND), 0),
  (UUID(), '03f9de6db8fb6931a4ce6e5596490243ce29a5cccc1b3cb18638073419bee58c', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 37 SECOND), '20261002200000_cliente_fecha_saldo_password', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 38 SECOND), 0),
  (UUID(), '5b05881f070beb957a6e31b990c47be72686f3c016b968276f62c6bc755ce70f', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 35 SECOND), '20261002210000_equipo_created_at', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 36 SECOND), 0),
  (UUID(), '8840b6c99b71d9aa3e9686034d319d81facc2916c61c17ded111d207a357ac8c', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 33 SECOND), '20261002220000_movimiento_fecha_date', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 34 SECOND), 0),
  (UUID(), '300e9236b751d92c5094d7a636d5e38ce95c80cbb37c851444e96b427a9145a0', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 31 SECOND), '20261002230000_articulo_lookup_empresa_fks', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 32 SECOND), 0),
  (UUID(), '2ebe93af3a4d96e769730e21a9ed6a19f5310de64802c4b9f9c85f431bd22b39', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 29 SECOND), '20261005220000_equipo_cliente_foreign_key', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 30 SECOND), 0),
  (UUID(), '8f5ced2c2fffcde21ca8841e42d34fbcab67f2933cf16de80a53b3f030d55100', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 27 SECOND), '20261005230000_drop_movimiento_customer_snapshots', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 28 SECOND), 0),
  (UUID(), 'c95041d9aadd6b10e0488040c9fd31352571b629e06fc9ddddb77ad48bd70423', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 25 SECOND), '20261006000000_empresa_slug', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 26 SECOND), 0),
  (UUID(), 'fe63d31439e88a5a93b71bf5ee878bff6ae65984d676d42a779eeb002bfe634f', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 23 SECOND), '20261007000000_usuario_refresh_token', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 24 SECOND), 0),
  (UUID(), '177dd1f2c50fd8e51dc0ac8926f7c318ae54e554a236ce9dc3f959036c5b98ce', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 21 SECOND), '20261008000000_cliente_contact_fields', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 22 SECOND), 0),
  (UUID(), '02e158b96a731b51d9c66d4d380bc0d2764124e1f98817c077665736bc39c9e0', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 19 SECOND), '20261008010000_ubicacion_and_articulo_relation', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 20 SECOND), 0),
  (UUID(), '1aaff8c1771a8bbe34adf69df8d42ef99bf0e7d57fd433f5d4e2fcd20f85fe28', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 17 SECOND), '20261009000000_cliente_updated_at', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 18 SECOND), 0),
  (UUID(), '94c5246437814676d3667e3f6e41914927856c232da29f1aefbdcfa1c271dc22', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 15 SECOND), '20261010000000_empresa_module_flags', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 16 SECOND), 0),
  (UUID(), 'da932f8d0c4bcba0fbc0aa6a8e812c0bb6cdb40bfbf191da714423449a3d6116', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 13 SECOND), '20261011000000_empresa_habilitar_excel', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 14 SECOND), 0),
  (UUID(), '0046ee00b3e0418ea76f4f9c21083e4346432bae963ffd927a1e290b80b14654', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 11 SECOND), '20261012000000_cliente_updated_at_date', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 12 SECOND), 0),
  (UUID(), '04c560ba0a465d6295f523491413a603c506c6efe70833bdacdf63d480c048ea', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 9 SECOND), '20261013000000_movimiento_seen_at', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 10 SECOND), 0),
  (UUID(), '9d24660f3b7e0697e2fba28b7485f869449df84e580e654d95198f1785ba40a9', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 SECOND), '20261014000000_usuario_rol_interno', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 8 SECOND), 0),
  (UUID(), '69dc27d84bbd00258fe1f1373ac1ca597bf45b7b2b1ceb69e3783a8174e60135', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 5 SECOND), '20261015000000_empresa_excel_import_token', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 6 SECOND), 0),
  (UUID(), '2e5d0dd906fa8a57b2f4e0ac18e25a81cd1a3524e6dc4d835cfe66d5370bd000', DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 3 SECOND), '20261016000000_empresa_page_navigation', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 4 SECOND), 0),
  (UUID(), '4a221549db9604d4e1aeb8163034a6ede07a5393b4b21151ac85dfbd16428ab7', UTC_TIMESTAMP(3), '20261017000000_movimiento_empresa_composite_pk', NULL, NULL, DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 2 SECOND), 0);
