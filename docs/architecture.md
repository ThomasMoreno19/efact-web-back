# Arquitectura modular del backend

Los módulos de negocio siguen Arquitectura Hexagonal. Las dependencias apuntan hacia el dominio y la aplicación: `infrastructure → application → domain`. Las capas internas no conocen NestJS, Prisma, HTTP ni los adaptadores concretos.

## Estructura de un módulo

```text
src/<modulo>/
  domain/                         # Entidades, value objects y reglas propias, si existen
  application/
    exceptions/                   # Errores de aplicación sin dependencias de framework
    mappers/                      # Conversión de commands/resultados
    ports/                        # Contratos y tokens para dependencias externas
    use-cases/<accion>/
      <accion>.command.ts
      <accion>.use-case.ts
  infrastructure/
    adapters/
      in/
        <modulo>.controller.ts
        dtos/
      out/                        # Implementaciones de ports: Prisma, tokens, servicios externos
    <modulo>.module.ts            # Composición e inyección de dependencias
```

`domain/` se agrega cuando el módulo tiene entidades, value objects o invariantes propios. Si el módulo coordina conceptos de otro dominio —como `auth`, que opera sobre `Usuario`— no crear entidades artificiales ni carpetas vacías.

## Responsabilidades y dependencias

- **Domain:** reglas de negocio y estado. No importa NestJS, Prisma, Express, DTOs ni servicios de infraestructura.
- **Application:** commands, ports, use cases, mappers de aplicación y excepciones. Un use case coordina la operación usando contratos; no usa `@Injectable`, `@Inject`, `UnauthorizedException`, `PrismaService`, `ConfigService` ni implementaciones concretas.
- **Infrastructure:** HTTP, validación de requests, autenticación técnica, persistencia, librerías externas y composición de dependencias. Los controllers traducen HTTP a commands y resultados; no implementan reglas de negocio ni acceden directamente a Prisma.
- **Ports:** los define `application`; los implementa `infrastructure`. Los tokens de inyección viven junto al port.
- **Errores de aplicación:** extienden `ApplicationException` y exponen el status HTTP sin depender de excepciones de Nest. El filtro global los convierte en respuestas HTTP.

## Flujo de una operación

1. El controller recibe y valida un DTO de infraestructura.
2. El DTO se convierte a un command de aplicación.
3. El use case ejecuta las reglas y consulta ports cuando necesita persistencia, hashing, tokens u otros servicios.
4. Los adaptadores de salida implementan los ports y convierten sus modelos técnicos a tipos de la aplicación/dominio.
5. El controller devuelve el resultado HTTP sin exponer modelos de Prisma ni entidades internas.

Los use cases se registran en el módulo de infraestructura mediante factories y tokens de ports. Así se puede probar la aplicación sustituyendo sus dependencias sin inicializar Nest ni conectarse a una base de datos.

## Autenticación

La verificación HTTP de credenciales y la lectura del token pertenecen a infraestructura. La autenticación de usuario y la validación de la sesión son use cases de aplicación que dependen de `UsuarioRepository`, `PasswordHasher`, un port de hashing de refresh tokens y un port de tokens. La firma JWT, `ConfigService` y el almacenamiento del refresh-token-hash viven en infraestructura. `JWT_EXPIRES_IN` y `JWT_REFRESH_EXPIRES_IN` configuran la duración de las cookies de acceso y refresh. `@Public` es metadata HTTP de infraestructura; por defecto las rutas quedan protegidas por el guard global.

## Pruebas

- Probar entidades y reglas del dominio sin Nest ni base de datos.
- Probar use cases con mocks de sus ports.
- Probar mappers de persistencia y adaptadores en su capa.
- Reservar las pruebas E2E para validar el wiring HTTP, guards, módulos y persistencia integrada.
