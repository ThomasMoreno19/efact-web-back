import type {
  CatalogBulkImportRepository,
  CatalogImportMode,
  CatalogImportPlan,
} from '../ports/catalogo-bulk-import.repository';
import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';

export class ImportarCatalogoMasivoUseCase {
  constructor(private readonly repository: CatalogBulkImportRepository) {}

  countArticles(empresaId: number) {
    return this.repository.countArticles(empresaId);
  }

  execute(
    empresaId: number,
    plan: CatalogImportPlan,
    mode: CatalogImportMode,
    transaction: ImportTransactionContext,
  ) {
    return this.repository.import(empresaId, plan, mode, transaction);
  }
}
