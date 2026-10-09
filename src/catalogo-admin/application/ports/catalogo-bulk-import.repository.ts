import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';

export const CATALOGO_BULK_IMPORT_REPOSITORY = Symbol(
  'CATALOGO_BULK_IMPORT_REPOSITORY',
);

export type CatalogImportMode = 'actualizar' | 'sincronizar';

export interface CatalogImportSourceRow<T> {
  rowNumber: number;
  value: T;
}

export interface CatalogImportSet<T, TKey> {
  rows: CatalogImportSourceRow<T>[];
  deletedKeys: CatalogImportSourceRow<TKey>[];
}

export interface CatalogArticleImportRow {
  id: bigint;
  codigo_interno: number;
  codigo_barra: string | null;
  id_rubro: number | null;
  id_proveedor: number | null;
  id_marca: number | null;
  id_ubicacion: number | null;
  nombre: string;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  no_procesado: number;
  oferta: boolean;
  codigo_proveedor: string | null;
  tiene_existencia: boolean;
  existencia: number;
  minima_existencia: number | null;
  maxima_existencia: number | null;
  abreviatura: string | null;
  unidad_medida: string | null;
}

export interface CatalogLookupImportRow {
  id: number;
  nombre: string;
  abreviatura: string | null;
}

export interface CatalogLocationImportRow {
  id: number;
  descripcion: string;
}

export interface CatalogImportPlan {
  articulo: CatalogImportSet<CatalogArticleImportRow, bigint>;
  proveedor: CatalogImportSet<CatalogLookupImportRow, number>;
  rubro: CatalogImportSet<CatalogLookupImportRow, number>;
  marca: CatalogImportSet<CatalogLookupImportRow, number>;
  ubicacion: CatalogImportSet<CatalogLocationImportRow, number>;
}

export interface CatalogImportCounts {
  articulos: number;
  proveedores: number;
  rubros: number;
  marcas: number;
  ubicaciones: number;
}

export type CatalogDeleteCounts = CatalogImportCounts;

export interface CatalogBulkImportRepository {
  countArticles(empresaId: number): Promise<number>;
  import(
    empresaId: number,
    plan: CatalogImportPlan,
    mode: CatalogImportMode,
    transaction: ImportTransactionContext,
  ): Promise<CatalogDeleteCounts>;
}
