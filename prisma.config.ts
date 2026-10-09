import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const host = process.env.DB_HOST ?? '127.0.0.1';
const port = process.env.DB_PORT ?? '3306';
const user = encodeURIComponent(process.env.DB_USER ?? 'root');
const password = encodeURIComponent(process.env.DB_PASSWORD ?? 'root');
const database = encodeURIComponent(process.env.DB_NAME ?? 'efactweb_local');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      `mysql://${user}:${password}@${host}:${port}/${database}`,
  },
});
