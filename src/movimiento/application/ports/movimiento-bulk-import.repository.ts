import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';

export const MOVIMIENTO_BULK_IMPORT_REPOSITORY = Symbol(
  'MOVIMIENTO_BULK_IMPORT_REPOSITORY',
);

export type MovimientoImportMode = 'actualizar' | 'sincronizar';

export interface MovimientoImportRow {
  idMovimiento: number;
  idEquipo: number;
  estado: string | null;
  fecha: string | null;
  observacion: string | null;
}

export interface MovimientoImportSourceRow<T> {
  rowNumber: number;
  value: T;
}

export interface MovimientoBulkImportRepository {
  countByEmpresa(empresaId: number): Promise<number>;
  import(
    empresaId: number,
    rows: MovimientoImportSourceRow<MovimientoImportRow>[],
    activeIds: number[],
    mode: MovimientoImportMode,
    transaction: ImportTransactionContext,
  ): Promise<{ processed: number; deleted: number }>;
}
