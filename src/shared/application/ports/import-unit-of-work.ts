declare const importTransactionContextBrand: unique symbol;

export interface ImportTransactionContext {
  readonly [importTransactionContextBrand]: true;
}

export const IMPORT_UNIT_OF_WORK = Symbol('IMPORT_UNIT_OF_WORK');

export interface ImportUnitOfWork {
  execute<T>(
    operation: (context: ImportTransactionContext) => Promise<T>,
  ): Promise<T>;
}
