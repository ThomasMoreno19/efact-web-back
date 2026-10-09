# Contexto para agentes — Backend

Estas instrucciones aplican a `back/`. Para cambios en el frontend, consultar `front/AGENTS.md`.

## Prioridad: valor para el cliente

- No inventar funcionalidades, flujos ni reglas a partir de campos existentes o posibilidades técnicas. Implementar el valor pedido explícitamente; si el problema del cliente o la regla de producto no está clara, preguntar antes de ampliar el alcance.
- Respetar las reglas de negocio del módulo afectado: [`empresa`](docs/modules/empresa.md), [`cliente`](docs/modules/cliente.md) o [`usuario`](docs/modules/usuario.md).
- No duplicar rutas, comandos ni detalles de implementación deducibles del código/configuración. Las convenciones arquitectónicas compartidas se mantienen en [`architecture.md`](docs/architecture.md).

## Criterio de documentación

- Documentar solo reglas de negocio y contexto o contratos no deducibles del código que ayuden a tomar decisiones de implementación o eviten errores.
- No guardar bitácoras de tareas, cambios realizados, archivos modificados, migraciones ya ejecutadas ni decisiones transitorias. Comunicar el resumen del trabajo al usuario en la respuesta final, no en archivos de documentación.
- Antes de agregar o cambiar documentación, comprobar que la información siga vigente y resuelva una duda concreta; escribirla como regla o contexto actual, sin narrar cómo se llegó a ella.

## Pruebas y comentarios

- No crear pruebas unitarias, de integración, E2E ni de ningún otro tipo, salvo que el usuario lo pida explícitamente. Esta regla no restringe la ejecución de pruebas existentes.
- No agregar comentarios en ningún archivo del proyecto.

## Contexto externo al código

- Para cambios de esquema, migraciones o fechas, leer [`docs/data-compatibility.md`](docs/data-compatibility.md).
- Antes de aplicar cambios a la base desplegada en Web Hosting, leer [`docs/production-migrations.md`](docs/production-migrations.md). La base local y la remota son destinos distintos.
- Para cambios al almacenamiento o publicación de logotipos, leer [`docs/company-logos.md`](docs/company-logos.md); los archivos persistentes se respaldan y despliegan por separado de la base.
