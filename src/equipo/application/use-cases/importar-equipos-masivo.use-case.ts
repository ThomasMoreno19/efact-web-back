import type {
  EquipoBulkImportRepository,
  EquipoImportSourceRow,
  EquipoImportRow,
} from '../ports/equipo-bulk-import.repository';
import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';

export class ImportarEquiposMasivoUseCase {
  constructor(private readonly repository: EquipoBulkImportRepository) {}

  upsert(
    empresaId: number,
    rows: EquipoImportSourceRow<EquipoImportRow>[],
    transaction: ImportTransactionContext,
  ) {
    return this.repository.upsert(empresaId, rows, transaction);
  }

  synchronize(
    empresaId: number,
    activeIds: number[],
    transaction: ImportTransactionContext,
  ) {
    return this.repository.synchronize(empresaId, activeIds, transaction);
  }

  deleteForCustomers(
    empresaId: number,
    cuils: string[],
    transaction: ImportTransactionContext,
  ) {
    return this.repository.deleteForCustomers(empresaId, cuils, transaction);
  }
}
