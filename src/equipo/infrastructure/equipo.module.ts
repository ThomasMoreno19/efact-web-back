import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { ReadCacheService } from '@/shared/infrastructure/cache/read-cache.service';
import { EQUIPO_REPOSITORY } from '../application/ports/equipo.repository';
import { CreateEquipoUseCase } from '../application/use-cases/create-equipo/create-equipo.use-case';
import { DeleteEquipoUseCase } from '../application/use-cases/delete-equipo/delete-equipo.use-case';
import { FindAllEquiposUseCase } from '../application/use-cases/find-all-equipos/find-all-equipos.use-case';
import { FindEquipoByIdUseCase } from '../application/use-cases/find-equipo-by-id/find-equipo-by-id.use-case';
import { UpdateEquipoUseCase } from '../application/use-cases/update-equipo/update-equipo.use-case';
import { EquipoController } from './adapters/in/equipo.controller';
import { PrismaEquipoRepository } from './adapters/out/prisma-equipo.repository';
import { EQUIPO_BULK_IMPORT_REPOSITORY } from '../application/ports/equipo-bulk-import.repository';
import { ImportarEquiposMasivoUseCase } from '../application/use-cases/importar-equipos-masivo.use-case';
import { PrismaEquipoBulkImportRepository } from './adapters/out/prisma-equipo-bulk-import.repository';

@Module({
  controllers: [EquipoController],
  providers: [
    {
      provide: EQUIPO_REPOSITORY,
      useFactory: (prisma: PrismaService, readCache: ReadCacheService) =>
        new PrismaEquipoRepository(prisma, readCache),
      inject: [PrismaService, ReadCacheService],
    },
    PrismaEquipoBulkImportRepository,
    {
      provide: EQUIPO_BULK_IMPORT_REPOSITORY,
      useExisting: PrismaEquipoBulkImportRepository,
    },
    {
      provide: ImportarEquiposMasivoUseCase,
      useFactory: (repository: PrismaEquipoBulkImportRepository) =>
        new ImportarEquiposMasivoUseCase(repository),
      inject: [EQUIPO_BULK_IMPORT_REPOSITORY],
    },
    {
      provide: FindAllEquiposUseCase,
      useFactory: (repository: PrismaEquipoRepository) =>
        new FindAllEquiposUseCase(repository),
      inject: [EQUIPO_REPOSITORY],
    },
    {
      provide: FindEquipoByIdUseCase,
      useFactory: (repository: PrismaEquipoRepository) =>
        new FindEquipoByIdUseCase(repository),
      inject: [EQUIPO_REPOSITORY],
    },
    {
      provide: CreateEquipoUseCase,
      useFactory: (repository: PrismaEquipoRepository) =>
        new CreateEquipoUseCase(repository),
      inject: [EQUIPO_REPOSITORY],
    },
    {
      provide: UpdateEquipoUseCase,
      useFactory: (repository: PrismaEquipoRepository) =>
        new UpdateEquipoUseCase(repository),
      inject: [EQUIPO_REPOSITORY],
    },
    {
      provide: DeleteEquipoUseCase,
      useFactory: (repository: PrismaEquipoRepository) =>
        new DeleteEquipoUseCase(repository),
      inject: [EQUIPO_REPOSITORY],
    },
  ],
  exports: [ImportarEquiposMasivoUseCase],
})
export class EquipoModule {}
