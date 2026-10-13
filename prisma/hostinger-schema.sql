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
  `habilitar_excel` BOOLEAN NOT NULL DEFAULT TRUE,
  `imagenesEnArticulos` BOOLEAN NOT NULL DEFAULT TRUE,
  `incluirHorarios` BOOLEAN NOT NULL DEFAULT FALSE,
  `pedidosFueraHorario` BOOLEAN NOT NULL DEFAULT FALSE,
  `incluirCodigoBarra` BOOLEAN NOT NULL DEFAULT FALSE,
  `toleranciaMinDias` INTEGER NULL,
  `toleranciaMaxDias` INTEGER NULL,
  `catalogo_habilitado` BOOLEAN NOT NULL DEFAULT FALSE,
  `saldos_habilitados` BOOLEAN NOT NULL DEFAULT FALSE,
  `reparaciones_habilitadas` BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE INDEX `empresa_slug_unique` (`slug`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  INDEX `cliente_id_empresa_index` (`id_empresa`),
  PRIMARY KEY (`cuil`, `id_empresa`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `usuario` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `role` ENUM('Superadmin', 'Admin', 'Interno') NOT NULL DEFAULT 'Admin',
  `id_empresa` INTEGER NULL,
  `refresh_token` VARCHAR(255) NULL,
  UNIQUE INDEX `nombre` (`nombre`),
  INDEX `usuario_id_empresa_index` (`id_empresa`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  `tiene_existencia` BOOLEAN NOT NULL DEFAULT FALSE,
  `existencia` INTEGER NOT NULL,
  `minima_existencia` INTEGER NULL,
  `maxima_existencia` INTEGER NULL,
  `abreviatura` VARCHAR(40) NULL,
  `unidad_medida` VARCHAR(100) NULL,
  `actualizado_en` DATE NULL,
  INDEX `articulo_id_empresa` (`id_empresa`),
  INDEX `fk_articulo_marca` (`id_marca`, `id_empresa`),
  INDEX `fk_articulo_proveedor` (`id_proveedor`, `id_empresa`),
  INDEX `fk_articulo_rubro` (`id_rubro`, `id_empresa`),
  INDEX `fk_articulo_ubicacion` (`id_ubicacion`, `id_empresa`),
  PRIMARY KEY (`id`, `id_empresa`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `equipo` (
  `id` INTEGER UNSIGNED NOT NULL,
  `id_empresa` INTEGER NOT NULL,
  `marca` VARCHAR(150) NULL,
  `modelo` VARCHAR(150) NULL,
  `nombre_equipo` VARCHAR(150) NULL,
  `created_at` DATE NULL,
  `nro_serie` VARCHAR(100) NULL,
  `cuil` VARCHAR(30) NULL,
  INDEX `equipo_id_empresa_index` (`id_empresa`),
  INDEX `equipo_cuil_id_empresa_index` (`cuil`, `id_empresa`),
  PRIMARY KEY (`id`, `id_empresa`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `externo` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `contrasena` VARCHAR(255) NOT NULL,
  `id_empresa` INTEGER NOT NULL,
  INDEX `fk_externo_empresa` (`id_empresa`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `horarios_empresa` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `id_empresa` INTEGER NOT NULL,
  `dia_semana` TINYINT NOT NULL,
  `hora_apertura` TIME(0) NOT NULL,
  `hora_cierre` TIME(0) NOT NULL,
  INDEX `fk_horarios_empresa_empresa` (`id_empresa`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `interno` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `contrasena` VARCHAR(255) NOT NULL,
  `id_empresa` INTEGER NOT NULL,
  UNIQUE INDEX `uq_interno_empresa` (`id_empresa`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `marca` (
  `id` INTEGER NOT NULL,
  `id_empresa` INTEGER NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `abreviatura` VARCHAR(30) NULL,
  `logo_url` VARCHAR(255) NULL,
  `aparece_en_csv` BOOLEAN NOT NULL,
  INDEX `fk_marca_empresa` (`id_empresa`),
  PRIMARY KEY (`id`, `id_empresa`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `movimiento` (
  `id` INTEGER UNSIGNED NOT NULL,
  `id_empresa` INTEGER NOT NULL,
  `id_equipo` INTEGER UNSIGNED NOT NULL,
  `estado` VARCHAR(150) NULL,
  `fecha` DATE NULL,
  `observacion` TEXT NULL,
  `seen_at` DATETIME(0) NULL,
  `contrasena` VARCHAR(255) NULL,
  INDEX `movimiento_equipo_empresa_foreign` (`id_equipo`, `id_empresa`),
  INDEX `movimiento_id_empresa_index` (`id_empresa`),
  INDEX `movimiento_id_equipo_index` (`id_equipo`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `proveedor` (
  `id` INTEGER NOT NULL,
  `id_empresa` INTEGER NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `abreviatura` VARCHAR(30) NULL,
  `logo_url` VARCHAR(255) NULL,
  `aparece_en_csv` BOOLEAN NOT NULL,
  INDEX `fk_proveedor_empresa` (`id_empresa`),
  PRIMARY KEY (`id`, `id_empresa`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rubro` (
  `id` INTEGER NOT NULL,
  `nombre` VARCHAR(80) NOT NULL,
  `abreviatura` VARCHAR(30) NULL,
  `id_empresa` INTEGER NOT NULL,
  `aparece_en_csv` BOOLEAN NULL DEFAULT TRUE,
  `logo_url` VARCHAR(255) NULL,
  INDEX `id_empresa` (`id_empresa`),
  PRIMARY KEY (`id`, `id_empresa`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ubicacion` (
  `id` INTEGER NOT NULL,
  `id_empresa` INTEGER NOT NULL,
  `descripcion` VARCHAR(50) NOT NULL,
  INDEX `fk_ubicacion_empresa` (`id_empresa`),
  PRIMARY KEY (`id`, `id_empresa`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cache` (
  `key` VARCHAR(255) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  `expiration` BIGINT NOT NULL,
  INDEX `cache_expiration_index` (`expiration`),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` VARCHAR(255) NOT NULL,
  `owner` VARCHAR(255) NOT NULL,
  `expiration` BIGINT NOT NULL,
  INDEX `cache_locks_expiration_index` (`expiration`),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(255) NOT NULL,
  `connection` VARCHAR(255) NOT NULL,
  `queue` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `exception` LONGTEXT NOT NULL,
  `failed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  UNIQUE INDEX `failed_jobs_uuid_unique` (`uuid`),
  INDEX `failed_jobs_connection_queue_failed_at_index` (`connection`, `queue`, `failed_at`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `attempts` SMALLINT UNSIGNED NOT NULL,
  `reserved_at` INTEGER UNSIGNED NULL,
  `available_at` INTEGER UNSIGNED NOT NULL,
  `created_at` INTEGER UNSIGNED NOT NULL,
  INDEX `jobs_queue_index` (`queue`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `migrations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch` INTEGER NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP(0) NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `payload` LONGTEXT NOT NULL,
  `last_activity` INTEGER NOT NULL,
  INDEX `sessions_last_activity_index` (`last_activity`),
  INDEX `sessions_user_id_index` (`user_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP(0) NULL,
  `password` VARCHAR(255) NOT NULL,
  `remember_token` VARCHAR(100) NULL,
  `created_at` TIMESTAMP(0) NULL,
  `updated_at` TIMESTAMP(0) NULL,
  UNIQUE INDEX `users_email_unique` (`email`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
