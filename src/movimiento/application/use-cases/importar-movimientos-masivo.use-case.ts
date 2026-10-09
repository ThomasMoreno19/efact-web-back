import type {
  MovimientoBulkImportRepository,
  MovimientoImportMode,
  MovimientoImportRow,
  MovimientoImportSourceRow,
} from '../ports/movimiento-bulk-import.repository';
import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';

export class ImportarMovimientosMasivoUseCase {
  constructor(private readonly repository: MovimientoBulkImportRepository) {}

  countByEmpresa(empresaId: number) {
    return this.repository.countByEmpresa(empresaId);
  }

  execute(
    empresaId: number,
    rows: MovimientoImportSourceRow<MovimientoImportRow>[],
    activeIds: number[],
    mode: MovimientoImportMode,
    transaction: ImportTransactionContext,
  ) {
    return this.repository.import(
      empresaId,
      rows,
      activeIds,
      mode,
      transaction,
    );
  }
}
