import { Module } from '@nestjs/common';
import {
  EMPRESA_REPOSITORY,
  type EmpresaRepository,
} from '@/empresa/application/ports/empresa.repository';
import { EmpresaModule } from '@/empresa/infrastructure/empresa.module';
import { CLIENTE_REPOSITORY } from '../application/ports/cliente.repository';
import { CreateClienteUseCase } from '../application/use-cases/create-cliente/create-cliente.use-case';
import { DeleteClienteUseCase } from '../application/use-cases/delete-cliente/delete-cliente.use-case';
import { FindAllClientesUseCase } from '../application/use-cases/find-all-clientes/find-all-clientes.use-case';
import { FindClienteByCuilUseCase } from '../application/use-cases/find-cliente-by-cuil/find-cliente-by-cuil.use-case';
import { UpdateClienteUseCase } from '../application/use-cases/update-cliente/update-cliente.use-case';
import { ConsultarSaldoClienteUseCase } from '../application/use-cases/consultar-saldo-cliente/consultar-saldo-cliente.use-case';
import { ClienteController } from './adapters/in/cliente.controller';
import { PrismaClienteRepository } from './adapters/out/prisma-cliente.repository';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { ReadCacheService } from '@/shared/infrastructure/cache/read-cache.service';
import { PASSWORD_HASHER } from '@/shared/application/ports/password-hasher';
import { BcryptPasswordHasher } from '@/shared/infrastructure/security/bcrypt-password-hasher';
import { CLIENTE_BULK_IMPORT_REPOSITORY } from '../application/ports/cliente-bulk-import.repository';
import { ImportarClientesMasivoUseCase } from '../application/use-cases/importar-clientes-masivo.use-case';
import { PrismaClienteBulkImportRepository } from './adapters/out/prisma-cliente-bulk-import.repository';

@Module({
  imports: [EmpresaModule],
  controllers: [ClienteController],
  providers: [
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    PrismaClienteBulkImportRepository,
    {
      provide: CLIENTE_BULK_IMPORT_REPOSITORY,
      useExisting: PrismaClienteBulkImportRepository,
    },
    {
      provide: ImportarClientesMasivoUseCase,
      useFactory: (
        repository: PrismaClienteBulkImportRepository,
        passwordHasher: BcryptPasswordHasher,
      ) => new ImportarClientesMasivoUseCase(repository, passwordHasher),
      inject: [CLIENTE_BULK_IMPORT_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: CLIENTE_REPOSITORY,
      useFactory: (prisma: PrismaService, readCache: ReadCacheService) =>
        new PrismaClienteRepository(prisma, readCache),
      inject: [PrismaService, ReadCacheService],
    },
    {
      provide: CreateClienteUseCase,
      useFactory: (
        repository: PrismaClienteRepository,
        passwordHasher: BcryptPasswordHasher,
      ) => new CreateClienteUseCase(repository, passwordHasher),
      inject: [CLIENTE_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: DeleteClienteUseCase,
      useFactory: (repository: PrismaClienteRepository) =>
        new DeleteClienteUseCase(repository),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: FindAllClientesUseCase,
      useFactory: (repository: PrismaClienteRepository) =>
        new FindAllClientesUseCase(repository),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: FindClienteByCuilUseCase,
      useFactory: (repository: PrismaClienteRepository) =>
        new FindClienteByCuilUseCase(repository),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: UpdateClienteUseCase,
      useFactory: (
        repository: PrismaClienteRepository,
        passwordHasher: BcryptPasswordHasher,
      ) => new UpdateClienteUseCase(repository, passwordHasher),
      inject: [CLIENTE_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: ConsultarSaldoClienteUseCase,
      useFactory: (
        repository: PrismaClienteRepository,
        passwordHasher: BcryptPasswordHasher,
        empresaRepository: EmpresaRepository,
      ) =>
        new ConsultarSaldoClienteUseCase(
          repository,
          passwordHasher,
          empresaRepository,
        ),
      inject: [CLIENTE_REPOSITORY, PASSWORD_HASHER, EMPRESA_REPOSITORY],
    },
  ],
  exports: [ImportarClientesMasivoUseCase],
})
export class ClienteModule {}
