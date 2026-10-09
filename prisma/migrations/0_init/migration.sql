-- CreateTable
CREATE TABLE `empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(18) NULL,
    `ubicacion` VARCHAR(50) NULL,
    `tieneCarrito` BOOLEAN NOT NULL,
    `deshabilitar_excel` TINYINT NOT NULL,
    `logo_url` VARCHAR(255) NULL,
    `fecha_creacion` DATE NULL,
    `imagenesEnArticulos` BOOLEAN NOT NULL DEFAULT true,
    `incluirHorarios` BOOLEAN NOT NULL DEFAULT false,
    `pedidosFueraHorario` BOOLEAN NOT NULL DEFAULT false,
    `incluirCodigoBarra` BOOLEAN NOT NULL DEFAULT false,
    `toleranciaMinDias` INTEGER NULL,
    `toleranciaMaxDias` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `role` ENUM('Superadmin', 'Admin') NOT NULL DEFAULT 'Admin',
    `id_empresa` INTEGER NULL,

    UNIQUE INDEX `nombre`(`nombre`),
    UNIQUE INDEX `usuario_id_empresa_unique`(`id_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articulo` (
    `id` BIGINT NOT NULL,
    `codigo_interno` INTEGER NOT NULL,
    `codigo_barra` VARCHAR(20) NULL,
    `id_rubro` INTEGER NULL,
    `id_proveedor` INTEGER NULL,
    `id_marca` INTEGER NULL,
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
    `ubicacion` VARCHAR(50) NULL,
    `abreviatura` VARCHAR(40) NULL,
    `unidad_medida` VARCHAR(100) NULL,
    `actualizado_en` DATE NULL,

    INDEX `articulo_id_empresa`(`id_empresa`),
    INDEX `fk_articulo_marca`(`id_marca`, `id_empresa`),
    INDEX `fk_articulo_proveedor`(`id_proveedor`, `id_empresa`),
    INDEX `fk_articulo_rubro`(`id_rubro`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` BIGINT NOT NULL,

    INDEX `cache_expiration_index`(`expiration`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` BIGINT NOT NULL,

    INDEX `cache_locks_expiration_index`(`expiration`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipo` (
    `id` INTEGER UNSIGNED NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `marca` VARCHAR(150) NULL,
    `modelo` VARCHAR(150) NULL,
    `nombre_equipo` VARCHAR(150) NULL,
    `fecha_creacion` VARCHAR(30) NULL,
    `nro_serie` VARCHAR(100) NULL,

    INDEX `equipo_id_empresa_index`(`id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `externo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contrasena` VARCHAR(255) NOT NULL,
    `id_empresa` INTEGER NOT NULL,

    INDEX `fk_externo_empresa`(`id_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `horarios_empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `dia_semana` TINYINT NOT NULL,
    `hora_apertura` TIME(0) NOT NULL,
    `hora_cierre` TIME(0) NOT NULL,

    INDEX `fk_horarios_empresa_empresa`(`id_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- CreateTable
CREATE TABLE `interno` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contrasena` VARCHAR(255) NOT NULL,
    `id_empresa` INTEGER NOT NULL,

    UNIQUE INDEX `uq_interno_empresa`(`id_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE `marca` (
    `id` INTEGER NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `abreviatura` VARCHAR(30) NULL,
    `logo_url` VARCHAR(255) NULL,
    `aparece_en_csv` BOOLEAN NOT NULL,

    INDEX `fk_marca_empresa`(`id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimiento` (
    `id` INTEGER UNSIGNED NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `id_equipo` INTEGER UNSIGNED NOT NULL,
    `nombre_cliente` VARCHAR(150) NULL,
    `estado` VARCHAR(150) NULL,
    `fecha` VARCHAR(50) NULL,
    `observacion` TEXT NULL,
    `cuil` VARCHAR(30) NULL,
    `contrasena` VARCHAR(255) NULL,

    INDEX `movimiento_cuil_index`(`cuil`),
    INDEX `movimiento_equipo_empresa_foreign`(`id_equipo`, `id_empresa`),
    INDEX `movimiento_id_empresa_index`(`id_empresa`),
    INDEX `movimiento_id_equipo_index`(`id_equipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proveedor` (
    `id` INTEGER NOT NULL,
    `id_empresa` INTEGER NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `abreviatura` VARCHAR(30) NULL,
    `logo_url` VARCHAR(255) NULL,
    `aparece_en_csv` BOOLEAN NOT NULL,

    INDEX `fk_proveedor_empresa`(`id_empresa`),
    PRIMARY KEY (`id`, `id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_id_empresa_foreign` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `articulo` ADD CONSTRAINT `articulo_id_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipo` ADD CONSTRAINT `equipo_id_empresa_foreign` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `externo` ADD CONSTRAINT `fk_externo_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horarios_empresa` ADD CONSTRAINT `fk_horarios_empresa_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interno` ADD CONSTRAINT `fk_interno_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marca` ADD CONSTRAINT `fk_marca_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `movimiento` ADD CONSTRAINT `movimiento_equipo_empresa_foreign` FOREIGN KEY (`id_equipo`, `id_empresa`) REFERENCES `equipo`(`id`, `id_empresa`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `movimiento` ADD CONSTRAINT `movimiento_id_empresa_foreign` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `proveedor` ADD CONSTRAINT `fk_proveedor_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `rubro` ADD CONSTRAINT `Rubro_ibfk_1` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- These legacy MySQL foreign keys reference non-unique columns, so Prisma cannot
-- represent them in schema.prisma. Keep them in SQL to reproduce the live schema.
-- AddForeignKey
ALTER TABLE `articulo` ADD CONSTRAINT `fk_articulo_marca` FOREIGN KEY (`id_marca`) REFERENCES `marca`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articulo` ADD CONSTRAINT `fk_articulo_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
