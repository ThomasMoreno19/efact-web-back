import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import {
  EMPRESA_REPOSITORY,
  type EmpresaRepository,
} from '@/empresa/application/ports/empresa.repository';
import { EmpresaModule } from '@/empresa/infrastructure/empresa.module';
import { PrismaModule } from '@/shared/infrastructure/prisma/prisma.module';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { UsuarioModule } from '@/usuario/infrastructure/usuario.module';
import { INTERNO_REPOSITORY } from '../application/ports/interno.repository';
import { FindCatalogoInternoPageUseCase } from '../application/use-cases/find-catalogo-interno-page.use-case';
import { FindSaldosInternosUseCase } from '../application/use-cases/find-saldos-internos.use-case';
import { InternoController } from './adapters/in/interno.controller';
import { InternoAuthGuard } from './adapters/in/guards/interno-auth.guard';
import { PrismaInternoRepository } from './adapters/out/prisma-interno.repository';

@Module({
  imports: [AuthModule, EmpresaModule, PrismaModule, UsuarioModule],
  controllers: [InternoController],
  providers: [
    InternoAuthGuard,
    {
      provide: INTERNO_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaInternoRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: FindCatalogoInternoPageUseCase,
      useFactory: (
        repository: PrismaInternoRepository,
        empresas: EmpresaRepository,
      ) => new FindCatalogoInternoPageUseCase(repository, empresas),
      inject: [INTERNO_REPOSITORY, EMPRESA_REPOSITORY],
    },
    {
      provide: FindSaldosInternosUseCase,
      useFactory: (
        repository: PrismaInternoRepository,
        empresas: EmpresaRepository,
      ) => new FindSaldosInternosUseCase(repository, empresas),
      inject: [INTERNO_REPOSITORY, EMPRESA_REPOSITORY],
    },
  ],
})
export class InternoModule {}
