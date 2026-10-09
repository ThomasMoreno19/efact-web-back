import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';

export const CLIENTE_BULK_IMPORT_REPOSITORY = Symbol(
  'CLIENTE_BULK_IMPORT_REPOSITORY',
);

export type ClienteImportMode = 'actualizar' | 'sincronizar';

export interface ClienteImportRow {
  cuil: string;
  nombre: string | null;
  domicilio: string | null;
  localidad: string | null;
  telefonos: string | null;
  saldo: number | null;
  password: string | null;
}

export interface ClienteImportSourceRow<T> {
  rowNumber: number;
  value: T;
}

export interface ClienteImportSet {
  rows: ClienteImportSourceRow<ClienteImportRow>[];
  deletedKeys: ClienteImportSourceRow<string>[];
}

export interface ClienteBulkImportRepository {
  countByEmpresa(empresaId: number): Promise<number>;
  iterateCuilDeletionBatches(
    empresaId: number,
    activeCuils: string[],
    explicitCuils: string[],
    mode: ClienteImportMode,
    transaction: ImportTransactionContext,
  ): AsyncIterable<string[]>;
  upsert(
    empresaId: number,
    rows: ClienteImportSourceRow<
      ClienteImportRow & { passwordHash: string | null }
    >[],
    transaction: ImportTransactionContext,
  ): Promise<void>;
  delete(
    empresaId: number,
    cuils: string[],
    transaction: ImportTransactionContext,
  ): Promise<number>;
}
