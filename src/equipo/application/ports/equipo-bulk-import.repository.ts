import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';

export const EQUIPO_BULK_IMPORT_REPOSITORY = Symbol(
  'EQUIPO_BULK_IMPORT_REPOSITORY',
);

export interface EquipoImportRow {
  idEquipo: number;
  nombreEquipo: string | null;
  marca: string | null;
  modelo: string | null;
  nroSerie: string | null;
  cuil: string;
}

export interface EquipoImportSourceRow<T> {
  rowNumber: number;
  value: T;
}

export interface EquipoBulkImportRepository {
  upsert(
    empresaId: number,
    rows: EquipoImportSourceRow<EquipoImportRow>[],
    transaction: ImportTransactionContext,
  ): Promise<number>;
  synchronize(
    empresaId: number,
    activeIds: number[],
    transaction: ImportTransactionContext,
  ): Promise<number>;
  deleteForCustomers(
    empresaId: number,
    cuils: string[],
    transaction: ImportTransactionContext,
  ): Promise<number>;
}
