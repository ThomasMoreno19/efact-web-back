# Migraciones en Web Hosting

Notas operativas para la base MySQL desplegada, cuyo acceso y estado no se deducen del código. Leer junto con [`data-compatibility.md`](data-compatibility.md).

- `efactweb_local` y la base remota son destinos separados. Antes de migrar producción, verificar su esquema e historial; registrar `0_init` como aplicado solo si el esquema remoto ya corresponde al baseline. Nunca ejecutar el DDL de `0_init` sobre tablas existentes.
- Probar cambios en una copia aislada del esquema de producción, revisar todos los SQL pendientes y respaldar la base remota. `prisma migrate deploy` aplica todas las migraciones pendientes, no solo la última; no usar `migrate dev` en producción.
- Renombres y eliminaciones pueden romper la versión desplegada del backend. Coordinar cambios incompatibles con el despliegue o hacer una transición por etapas.
- La disponibilidad de conexión remota depende del hosting/IP. No guardar credenciales de producción en Git.
