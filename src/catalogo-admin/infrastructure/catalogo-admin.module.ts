import { Module } from '@nestjs/common';
import { EmpresaModule } from '@/empresa/infrastructure/empresa.module';
import { CompanyMediaStorageModule } from '@/shared/infrastructure/storage/company-media-storage.module';
import { CATALOGO_ADMIN_REPOSITORY } from '../application/ports/catalogo-admin.repository';
import { DeleteCatalogoRegistroUseCase } from '../application/use-cases/delete-catalogo-registro.use-case';
import { FindCatalogoListaUseCase } from '../application/use-cases/find-catalogo-lista.use-case';
import { UpdateCatalogoRegistroUseCase } from '../application/use-cases/update-catalogo-registro.use-case';
import { CatalogoAdminController } from './adapters/in/catalogo-admin.controller';
import { CatalogoPublicoController } from './adapters/in/catalogo-publico.controller';
import { CatalogoRegistroImagenController } from './adapters/in/catalogo-registro-imagen.controller';
import { PrismaCatalogoAdminRepository } from './adapters/out/prisma-catalogo-admin.repository';
import { CatalogoRegistroImagenService } from './catalogo-registro-imagen.service';
import { CATALOGO_BULK_IMPORT_REPOSITORY } from '../application/ports/catalogo-bulk-import.repository';
import { ImportarCatalogoMasivoUseCase } from '../application/use-cases/importar-catalogo-masivo.use-case';
import { PrismaCatalogoBulkImportRepository } from './adapters/out/prisma-catalogo-bulk-import.repository';
import { CATALOGO_IMAGE_IMPORT_PORT } from '../application/ports/catalog-image-import.port';
import { ImportarImagenesCatalogoUseCase } from '../application/use-cases/importar-imagenes-catalogo.use-case';
import { ImportarLoteImagenesCatalogoUseCase } from '../application/use-cases/importar-lote-imagenes-catalogo.use-case';
import { PedidoPublicoController } from './adapters/in/pedido-publico.controller';
import { PedidoPublicoService } from './pedido-publico.service';

@Module({
  imports: [CompanyMediaStorageModule, EmpresaModule],
  controllers: [
    CatalogoAdminController,
    CatalogoPublicoController,
    CatalogoRegistroImagenController,
    PedidoPublicoController,
  ],
  providers: [
    PrismaCatalogoAdminRepository,
    CatalogoRegistroImagenService,
    PedidoPublicoService,
    PrismaCatalogoBulkImportRepository,
    {
      provide: CATALOGO_BULK_IMPORT_REPOSITORY,
      useExisting: PrismaCatalogoBulkImportRepository,
    },
    {
      provide: ImportarCatalogoMasivoUseCase,
      useFactory: (repository: PrismaCatalogoBulkImportRepository) =>
        new ImportarCatalogoMasivoUseCase(repository),
      inject: [CATALOGO_BULK_IMPORT_REPOSITORY],
    },
    {
      provide: CATALOGO_IMAGE_IMPORT_PORT,
      useExisting: CatalogoRegistroImagenService,
    },
    {
      provide: ImportarImagenesCatalogoUseCase,
      useFactory: (imageImport: CatalogoRegistroImagenService) =>
        new ImportarImagenesCatalogoUseCase(imageImport),
      inject: [CATALOGO_IMAGE_IMPORT_PORT],
    },
    {
      provide: ImportarLoteImagenesCatalogoUseCase,
      useFactory: (imageImport: CatalogoRegistroImagenService) =>
        new ImportarLoteImagenesCatalogoUseCase(imageImport),
      inject: [CATALOGO_IMAGE_IMPORT_PORT],
    },
    {
      provide: CATALOGO_ADMIN_REPOSITORY,
      useExisting: PrismaCatalogoAdminRepository,
    },
    {
      provide: FindCatalogoListaUseCase,
      useFactory: (repository: PrismaCatalogoAdminRepository) =>
        new FindCatalogoListaUseCase(repository),
      inject: [CATALOGO_ADMIN_REPOSITORY],
    },
    {
      provide: UpdateCatalogoRegistroUseCase,
      useFactory: (repository: PrismaCatalogoAdminRepository) =>
        new UpdateCatalogoRegistroUseCase(repository),
      inject: [CATALOGO_ADMIN_REPOSITORY],
    },
    {
      provide: DeleteCatalogoRegistroUseCase,
      useFactory: (repository: PrismaCatalogoAdminRepository) =>
        new DeleteCatalogoRegistroUseCase(repository),
      inject: [CATALOGO_ADMIN_REPOSITORY],
    },
  ],
  exports: [
    ImportarCatalogoMasivoUseCase,
    ImportarImagenesCatalogoUseCase,
    ImportarLoteImagenesCatalogoUseCase,
  ],
})
export class CatalogoAdminModule {}
