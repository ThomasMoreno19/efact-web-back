CREATE TABLE `pedido_correlativo` (
    `id_empresa` INTEGER NOT NULL,
    `ultimo_numero` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (`id_empresa`),
    CONSTRAINT `pedido_correlativo_id_empresa_foreign` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pedido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `numero_pedido` INTEGER NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `observacion` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    INDEX `pedido_empresa_numero_index`(`id_empresa`, `numero_pedido`),
    PRIMARY KEY (`id`),
    CONSTRAINT `pedido_id_empresa_foreign` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `detalle_pedido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pedido` INTEGER NOT NULL,
    `id_articulo` BIGINT NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `observacion` VARCHAR(150) NULL,
    INDEX `detalle_pedido_id_pedido_index`(`id_pedido`),
    PRIMARY KEY (`id`),
    CONSTRAINT `detalle_pedido_id_pedido_foreign` FOREIGN KEY (`id_pedido`) REFERENCES `pedido`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
