import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { PASSWORD_HASHER } from '@/shared/application/ports/password-hasher';
import { BcryptPasswordHasher } from '@/shared/infrastructure/security/bcrypt-password-hasher';
import {
  EMPRESA_REPOSITORY,
  type EmpresaRepository,
} from '@/empresa/application/ports/empresa.repository';
import { EmpresaModule } from '@/empresa/infrastructure/empresa.module';
import { MOVIMIENTO_REPOSITORY } from '../application/ports/movimiento.repository';
import { CreateMovimientoUseCase } from '../application/use-cases/create-movimiento/create-movimiento.use-case';
import { DeleteMovimientoUseCase } from '../application/use-cases/delete-movimiento/delete-movimiento.use-case';
import { FindAllMovimientosUseCase } from '../application/use-cases/find-all-movimientos/find-all-movimientos.use-case';
import { FindMovimientosPageUseCase } from '../application/use-cases/find-movimientos-page/find-movimientos-page.use-case';
import { FindMovimientoByIdUseCase } from '../application/use-cases/find-movimiento-by-id/find-movimiento-by-id.use-case';
import { UpdateMovimientoUseCase } from '../application/use-cases/update-movimiento/update-movimiento.use-case';
import { MovimientoController } from './adapters/in/movimiento.controller';
import { ReparacionesPublicasController } from './adapters/in/reparaciones-publicas.controller';
import { PrismaMovimientoRepository } from './adapters/out/prisma-movimiento.repository';
import { ConsultarReparacionesPublicasUseCase } from '../application/use-cases/consultar-reparaciones-publicas/consultar-reparaciones-publicas.use-case';
import { MOVIMIENTO_BULK_IMPORT_REPOSITORY } from '../application/ports/movimiento-bulk-import.repository';
import { ImportarMovimientosMasivoUseCase } from '../application/use-cases/importar-movimientos-masivo.use-case';
import { PrismaMovimientoBulkImportRepository } from './adapters/out/prisma-movimiento-bulk-import.repository';

@Module({
  imports: [EmpresaModule],
  controllers: [MovimientoController, ReparacionesPublicasController],
  providers: [
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    PrismaMovimientoBulkImportRepository,
    {
      provide: MOVIMIENTO_BULK_IMPORT_REPOSITORY,
      useExisting: PrismaMovimientoBulkImportRepository,
    },
    {
      provide: ImportarMovimientosMasivoUseCase,
      useFactory: (repository: PrismaMovimientoBulkImportRepository) =>
        new ImportarMovimientosMasivoUseCase(repository),
      inject: [MOVIMIENTO_BULK_IMPORT_REPOSITORY],
    },
    {
      provide: MOVIMIENTO_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaMovimientoRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: FindAllMovimientosUseCase,
      useFactory: (repository: PrismaMovimientoRepository) =>
        new FindAllMovimientosUseCase(repository),
      inject: [MOVIMIENTO_REPOSITORY],
    },
    {
      provide: FindMovimientosPageUseCase,
      useFactory: (repository: PrismaMovimientoRepository) =>
        new FindMovimientosPageUseCase(repository),
      inject: [MOVIMIENTO_REPOSITORY],
    },
    {
      provide: ConsultarReparacionesPublicasUseCase,
      useFactory: (
        movimientoRepository: PrismaMovimientoRepository,
        empresaRepository: EmpresaRepository,
        passwordHasher: BcryptPasswordHasher,
      ) =>
        new ConsultarReparacionesPublicasUseCase(
          movimientoRepository,
          empresaRepository,
          passwordHasher,
        ),
      inject: [MOVIMIENTO_REPOSITORY, EMPRESA_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: FindMovimientoByIdUseCase,
      useFactory: (repository: PrismaMovimientoRepository) =>
        new FindMovimientoByIdUseCase(repository),
      inject: [MOVIMIENTO_REPOSITORY],
    },
    {
      provide: CreateMovimientoUseCase,
      useFactory: (repository: PrismaMovimientoRepository) =>
        new CreateMovimientoUseCase(repository),
      inject: [MOVIMIENTO_REPOSITORY],
    },
    {
      provide: UpdateMovimientoUseCase,
      useFactory: (repository: PrismaMovimientoRepository) =>
        new UpdateMovimientoUseCase(repository),
      inject: [MOVIMIENTO_REPOSITORY],
    },
    {
      provide: DeleteMovimientoUseCase,
      useFactory: (repository: PrismaMovimientoRepository) =>
        new DeleteMovimientoUseCase(repository),
      inject: [MOVIMIENTO_REPOSITORY],
    },
  ],
  exports: [ImportarMovimientosMasivoUseCase],
})
export class MovimientoModule {}
