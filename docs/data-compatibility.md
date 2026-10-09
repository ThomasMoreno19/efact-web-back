# Compatibilidad de datos existentes

Consultar estas notas al cambiar el esquema, las migraciones o el tratamiento de fechas. Contienen restricciones de los datos y bases existentes que no se deducen del código.

## Bases y esquema legado

- `efactweb_local` y la base de Web Hosting son destinos distintos; no asumir que comparten esquema o historial. Antes de migrar Web Hosting, verificar allí su estado. No ejecutar el DDL de `prisma/migrations/0_init/migration.sql` sobre tablas existentes. Ver [`production-migrations.md`](production-migrations.md).
- Las tablas heredadas `cache`, `cache_locks`, `failed_jobs`, `job_batches`, `jobs`, `migrations`, `password_reset_tokens`, `sessions` y `users` son infraestructura de Laravel, no funciones de la aplicación NestJS. `migrations` es el registro de Laravel; Prisma usa `_prisma_migrations`. No borrarlas como parte de una limpieza incidental del esquema: una eliminación física requiere un requisito explícito y revisar su impacto en los datos.
- El esquema legado tiene claves foráneas MySQL no estándar `articulo.id_marca → marca.id` y `articulo.id_proveedor → proveedor.id`, que apuntan a columnas no únicas individualmente y no pueden expresarse en el schema validable de Prisma. Revisar su tratamiento en cualquier migración que afecte esas tablas.
- En los datos legados locales, `equipo.fecha_creacion` usaba formato `D/M/YYYY` y las cadenas vacías representaban ausencia. No asumir que Web Hosting tiene el mismo formato; verificar sus datos antes de migrar.
- El vínculo equipo-cliente usa `equipo.cuil` junto con `id_empresa`, que referencia la clave compuesta de `cliente`, y es opcional. El cliente correspondiente a un `movimiento` se determina a través de su equipo; no inferir ni reconstruir asociaciones desde snapshots históricos de nombre o CUIL, que pueden no coincidir con el cliente actualmente asignado.
- `usuario.refresh_token` guarda solamente el hash SHA-256 del refresh token vigente. Es nullable para conservar las cuentas existentes; el login lo completa y logout lo limpia.

## Semántica temporal

- Una fecha calendario representa un día, sin hora ni zona horaria. Se expone como `YYYY-MM-DD`; no convertirla en instante ni desplazar el día por zona horaria.
- Las marcas de auditoría de empresa representan instantes. Se almacenan en UTC y, cuando se muestran como fecha a usuarios argentinos, se usa `America/Argentina/Buenos_Aires`. No convertir esos instantes a `DATE` ni cambiar el instante para corregir su presentación.
- `cliente.updated_at` representa una fecha calendario de Argentina y se almacena como `DATE`; no es un instante ni incluye hora o zona horaria.
- En los registros de empresa sin fecha histórica de creación disponible, `createdAt` contiene un instante UTC asignado por defecto; no interpretarlo como una fecha real de creación.
- Antes de convertir datos, comprobar si cada campo representa un día calendario o un instante y preservar esa semántica. El nombre o tipo actual no siempre refleja el significado histórico.
