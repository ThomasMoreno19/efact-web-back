# E-fact Backend

API de E-fact construida con NestJS; persiste datos en MySQL mediante Prisma.

## Desarrollo local

1. Copiar `.env.example` como `.env` y configurar la conexión MySQL.
2. Definir `AUTH_TOKEN_SECRET` con al menos 32 bytes y `EXCEL_IMPORT_TOKEN_ENCRYPTION_KEY` con una clave aleatoria de al menos 32 bytes; se puede generar con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Mantener la clave de cifrado estable para poder recuperar los tokens guardados. El backend escucha en el puerto `3000` por defecto.
3. Desde `back/`, instalar dependencias con `pnpm install` e iniciar con `pnpm start:dev`.

## Verificaciones

- `pnpm build`: genera Prisma Client y compila la API.
- `pnpm test`: ejecuta pruebas unitarias.
- `pnpm test:e2e`: ejecuta pruebas de integración contra la configuración de base de datos actual.
