import type { CatalogImportPlan } from '@/catalogo-admin/application/ports/catalogo-bulk-import.repository';
import { ImportarCatalogoMasivoUseCase } from '@/catalogo-admin/application/use-cases/importar-catalogo-masivo.use-case';
import type { ClienteImportSet } from '@/cliente/application/ports/cliente-bulk-import.repository';
import { ImportarClientesMasivoUseCase } from '@/cliente/application/use-cases/importar-clientes-masivo.use-case';
import { EnsureEmpresaExcelImportEnabledUseCase } from '@/empresa/application/use-cases/ensure-empresa-excel-import-enabled.use-case';
import { ImportarEquiposMasivoUseCase } from '@/equipo/application/use-cases/importar-equipos-masivo.use-case';
import type { ImportUnitOfWork } from '@/shared/application/ports/import-unit-of-work';

export type ExcelCatalogImportMode = 'actualizar' | 'sincronizar';

export class ImportarExcelCatalogoUseCase {
  constructor(
    private readonly ensureExcelEnabled: EnsureEmpresaExcelImportEnabledUseCase,
    private readonly catalogImport: ImportarCatalogoMasivoUseCase,
    private readonly customerImport: ImportarClientesMasivoUseCase,
    private readonly equipmentImport: ImportarEquiposMasivoUseCase,
    private readonly unitOfWork: ImportUnitOfWork,
  ) {}

  ensureImportEnabled(empresaId: number) {
    return this.ensureExcelEnabled.execute(empresaId);
  }

  async preview(empresaId: number, articleRows: number) {
    await this.ensureExcelEnabled.execute(empresaId);
    return {
      articulosBd: await this.catalogImport.countArticles(empresaId),
      articulosExcel: articleRows,
    };
  }

  async execute(
    empresaId: number,
    catalogPlan: CatalogImportPlan,
    customerSet: ClienteImportSet,
    mode: ExcelCatalogImportMode,
    includePreview = false,
  ) {
    await this.ensureExcelEnabled.execute(empresaId);
    const preview = includePreview
      ? {
          articulosBd: await this.catalogImport.countArticles(empresaId),
          articulosExcel: catalogPlan.articulo.rows.length,
        }
      : undefined;
    const importResult = await this.unitOfWork.execute(async (transaction) => {
      const catalogDeleted = await this.catalogImport.execute(
        empresaId,
        catalogPlan,
        mode,
        transaction,
      );
      const processedCustomers = await this.customerImport.upsert(
        empresaId,
        customerSet,
        transaction,
      );
      let deletedCustomers = 0;
      let deletedEquipment = 0;
      for await (const cuils of this.customerImport.deletionBatches(
        empresaId,
        customerSet,
        mode,
        transaction,
      )) {
        deletedEquipment += await this.equipmentImport.deleteForCustomers(
          empresaId,
          cuils,
          transaction,
        );
        deletedCustomers += await this.customerImport.delete(
          empresaId,
          cuils,
          transaction,
        );
      }

      return {
        catalogDeleted,
        processedCustomers,
        deletedCustomers,
        deletedEquipment,
      };
    });

    return {
      mode,
      processed: {
        articulos: catalogPlan.articulo.rows.length,
        proveedores: catalogPlan.proveedor.rows.length,
        rubros: catalogPlan.rubro.rows.length,
        marcas: catalogPlan.marca.rows.length,
        clientes: importResult.processedCustomers,
        ubicaciones: catalogPlan.ubicacion.rows.length,
      },
      deleted: {
        articulos: importResult.catalogDeleted.articulos,
        proveedores: importResult.catalogDeleted.proveedores,
        rubros: importResult.catalogDeleted.rubros,
        marcas: importResult.catalogDeleted.marcas,
        clientes: importResult.deletedCustomers,
        ubicaciones: importResult.catalogDeleted.ubicaciones,
      },
      equiposEliminados: importResult.deletedEquipment,
      ...(preview ? { preview } : {}),
    };
  }
}
