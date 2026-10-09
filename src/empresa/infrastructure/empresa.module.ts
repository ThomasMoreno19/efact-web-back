import { Module } from '@nestjs/common';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

import { EMPRESA_REPOSITORY } from '../application/ports/empresa.repository';
import { CreateEmpresaUseCase } from '../application/use-cases/create-empresa/create-empresa.use-case';
import { DeleteEmpresaUseCase } from '../application/use-cases/delete-empresa/delete-empresa.use-case';
import { FindAllEmpresasUseCase } from '../application/use-cases/find-all-empresas/find-all-empresas.use-case';
import { FindEmpresaByIdUseCase } from '../application/use-cases/find-empresa-by-id/find-empresa-by-id.use-case';
import { UpdateEmpresaUseCase } from '../application/use-cases/update-empresa/update-empresa.use-case';
import { FindHorariosEmpresaUseCase } from '../application/use-cases/find-horarios-empresa/find-horarios-empresa.use-case';
import { ReplaceHorariosEmpresaUseCase } from '../application/use-cases/replace-horarios-empresa/replace-horarios-empresa.use-case';
import { FindPublicEmpresaBySlugUseCase } from '../application/use-cases/find-public-empresa-by-slug/find-public-empresa-by-slug.use-case';
import { GetEmpresaExcelImportTokenUseCase } from '../application/use-cases/get-empresa-excel-import-token/get-empresa-excel-import-token.use-case';
import { EnsureEmpresaExcelImportEnabledUseCase } from '../application/use-cases/ensure-empresa-excel-import-enabled.use-case';
import { EmpresaController } from './adapters/in/empresa.controller';
import { PrismaEmpresaRepository } from './adapters/out/prisma-empresa.repository';
import { PrismaHorarioEmpresaRepository } from './adapters/out/prisma-horario-empresa.repository';
import { EmpresaLogoController } from './empresa-logo.controller';
import { EmpresaLogoService } from './empresa-logo.service';
import { CompanyMediaStorageModule } from '@/shared/infrastructure/storage/company-media-storage.module';
import { HORARIO_EMPRESA_REPOSITORY } from '../application/ports/horario-empresa.repository';
import { CompanyExcelImportTokenModule } from '@/shared/infrastructure/security/company-excel-import-token.module';
import { CompanyExcelImportTokenService } from '@/shared/infrastructure/security/company-excel-import-token.service';

@Module({
  imports: [CompanyMediaStorageModule, CompanyExcelImportTokenModule],
  controllers: [EmpresaController, EmpresaLogoController],
  providers: [
    EmpresaLogoService,
    {
      provide: EMPRESA_REPOSITORY,
      useFactory: (
        prisma: PrismaService,
        excelImportTokens: CompanyExcelImportTokenService,
      ) => new PrismaEmpresaRepository(prisma, excelImportTokens),
      inject: [PrismaService, CompanyExcelImportTokenService],
    },
    {
      provide: FindAllEmpresasUseCase,
      useFactory: (repository: PrismaEmpresaRepository) =>
        new FindAllEmpresasUseCase(repository),
      inject: [EMPRESA_REPOSITORY],
    },
    {
      provide: FindPublicEmpresaBySlugUseCase,
      useFactory: (repository: PrismaEmpresaRepository) =>
        new FindPublicEmpresaBySlugUseCase(repository),
      inject: [EMPRESA_REPOSITORY],
    },
    {
      provide: FindEmpresaByIdUseCase,
      useFactory: (repository: PrismaEmpresaRepository) =>
        new FindEmpresaByIdUseCase(repository),
      inject: [EMPRESA_REPOSITORY],
    },
    {
      provide: GetEmpresaExcelImportTokenUseCase,
      useFactory: (repository: PrismaEmpresaRepository) =>
        new GetEmpresaExcelImportTokenUseCase(repository),
      inject: [EMPRESA_REPOSITORY],
    },
    {
      provide: EnsureEmpresaExcelImportEnabledUseCase,
      useFactory: (repository: PrismaEmpresaRepository) =>
        new EnsureEmpresaExcelImportEnabledUseCase(repository),
      inject: [EMPRESA_REPOSITORY],
    },
    {
      provide: CreateEmpresaUseCase,
      useFactory: (repository: PrismaEmpresaRepository) =>
        new CreateEmpresaUseCase(repository),
      inject: [EMPRESA_REPOSITORY],
    },
    {
      provide: UpdateEmpresaUseCase,
      useFactory: (repository: PrismaEmpresaRepository) =>
        new UpdateEmpresaUseCase(repository),
      inject: [EMPRESA_REPOSITORY],
    },
    {
      provide: DeleteEmpresaUseCase,
      useFactory: (repository: PrismaEmpresaRepository) =>
        new DeleteEmpresaUseCase(repository),
      inject: [EMPRESA_REPOSITORY],
    },
    {
      provide: HORARIO_EMPRESA_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaHorarioEmpresaRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: FindHorariosEmpresaUseCase,
      useFactory: (
        empresaRepository: PrismaEmpresaRepository,
        horarioRepository: PrismaHorarioEmpresaRepository,
      ) => new FindHorariosEmpresaUseCase(empresaRepository, horarioRepository),
      inject: [EMPRESA_REPOSITORY, HORARIO_EMPRESA_REPOSITORY],
    },
    {
      provide: ReplaceHorariosEmpresaUseCase,
      useFactory: (
        empresaRepository: PrismaEmpresaRepository,
        horarioRepository: PrismaHorarioEmpresaRepository,
      ) =>
        new ReplaceHorariosEmpresaUseCase(empresaRepository, horarioRepository),
      inject: [EMPRESA_REPOSITORY, HORARIO_EMPRESA_REPOSITORY],
    },
  ],
  exports: [EMPRESA_REPOSITORY, EnsureEmpresaExcelImportEnabledUseCase],
})
export class EmpresaModule {}
