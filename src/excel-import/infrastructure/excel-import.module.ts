import { Module } from '@nestjs/common';
import { CatalogoAdminModule } from '@/catalogo-admin/infrastructure/catalogo-admin.module';
import { ImportarCatalogoMasivoUseCase } from '@/catalogo-admin/application/use-cases/importar-catalogo-masivo.use-case';
import { ImportarClientesMasivoUseCase } from '@/cliente/application/use-cases/importar-clientes-masivo.use-case';
import { ClienteModule } from '@/cliente/infrastructure/cliente.module';
import { EnsureEmpresaExcelImportEnabledUseCase } from '@/empresa/application/use-cases/ensure-empresa-excel-import-enabled.use-case';
import { EmpresaModule } from '@/empresa/infrastructure/empresa.module';
import { ImportarEquiposMasivoUseCase } from '@/equipo/application/use-cases/importar-equipos-masivo.use-case';
import { EquipoModule } from '@/equipo/infrastructure/equipo.module';
import { ImportarMovimientosMasivoUseCase } from '@/movimiento/application/use-cases/importar-movimientos-masivo.use-case';
import { MovimientoModule } from '@/movimiento/infrastructure/movimiento.module';
import {
  IMPORT_UNIT_OF_WORK,
  type ImportUnitOfWork,
} from '@/shared/application/ports/import-unit-of-work';
import { PrismaModule } from '@/shared/infrastructure/prisma/prisma.module';
import { CompanyExcelImportTokenModule } from '@/shared/infrastructure/security/company-excel-import-token.module';
import { ImportarExcelCatalogoUseCase } from '../application/use-cases/importar-excel-catalogo.use-case';
import { ImportarExcelReparacionesUseCase } from '../application/use-cases/importar-excel-reparaciones.use-case';
import { ExcelImportController } from './excel-import.controller';
import { ExcelImportTokenController } from './excel-import-token.controller';
import { ExcelImportTokenGuard } from './excel-import-token.guard';
import { ExcelImportService } from './excel-import.service';
import { ExcelWorkbookParser } from './excel-workbook.parser';
import { RepairExcelImportService } from './reparacion-excel-import.service';
import { RepairWorkbookParser } from './reparacion-workbook.parser';

@Module({
  imports: [
    PrismaModule,
    CompanyExcelImportTokenModule,
    CatalogoAdminModule,
    ClienteModule,
    EmpresaModule,
    EquipoModule,
    MovimientoModule,
  ],
  controllers: [ExcelImportController, ExcelImportTokenController],
  providers: [
    ExcelImportService,
    ExcelWorkbookParser,
    RepairExcelImportService,
    RepairWorkbookParser,
    ExcelImportTokenGuard,
    {
      provide: ImportarExcelCatalogoUseCase,
      useFactory: (
        ensureExcelEnabled: EnsureEmpresaExcelImportEnabledUseCase,
        catalogImport: ImportarCatalogoMasivoUseCase,
        customerImport: ImportarClientesMasivoUseCase,
        equipmentImport: ImportarEquiposMasivoUseCase,
        unitOfWork: ImportUnitOfWork,
      ) =>
        new ImportarExcelCatalogoUseCase(
          ensureExcelEnabled,
          catalogImport,
          customerImport,
          equipmentImport,
          unitOfWork,
        ),
      inject: [
        EnsureEmpresaExcelImportEnabledUseCase,
        ImportarCatalogoMasivoUseCase,
        ImportarClientesMasivoUseCase,
        ImportarEquiposMasivoUseCase,
        IMPORT_UNIT_OF_WORK,
      ],
    },
    {
      provide: ImportarExcelReparacionesUseCase,
      useFactory: (
        ensureExcelEnabled: EnsureEmpresaExcelImportEnabledUseCase,
        customerImport: ImportarClientesMasivoUseCase,
        equipmentImport: ImportarEquiposMasivoUseCase,
        movementImport: ImportarMovimientosMasivoUseCase,
        unitOfWork: ImportUnitOfWork,
      ) =>
        new ImportarExcelReparacionesUseCase(
          ensureExcelEnabled,
          customerImport,
          equipmentImport,
          movementImport,
          unitOfWork,
        ),
      inject: [
        EnsureEmpresaExcelImportEnabledUseCase,
        ImportarClientesMasivoUseCase,
        ImportarEquiposMasivoUseCase,
        ImportarMovimientosMasivoUseCase,
        IMPORT_UNIT_OF_WORK,
      ],
    },
  ],
})
export class ExcelImportModule {}
