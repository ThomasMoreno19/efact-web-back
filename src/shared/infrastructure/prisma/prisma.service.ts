import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: config.getOrThrow<string>('DB_HOST'),
      port: Number(config.getOrThrow<string>('DB_PORT')),
      user: config.getOrThrow<string>('DB_USER'),
      password: config.getOrThrow<string>('DB_PASSWORD'),
      database: config.getOrThrow<string>('DB_NAME'),
      connectionLimit: 2,
      minimumIdle: 1,
      // Prisma's MariaDB adapter interprets DATETIME values as UTC. Keep both
      // driver serialization and SQL defaults (CURRENT_TIMESTAMP) in UTC.
      timezone: 'Z',
      initSql: "SET time_zone = '+00:00'",
      allowPublicKeyRetrieval: true,
    });

    super({ adapter });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
