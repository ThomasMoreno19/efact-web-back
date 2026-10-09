export const MAX_CATALOGO_REGISTRO_IMAGEN_BYTES = 50 * 1024 * 1024;
export const MAX_CATALOGO_IMAGENES_LOTE_BYTES = 80 * 1024 * 1024;
export const MAX_CATALOGO_IMAGENES_LOTE_ARCHIVOS = 20;
export const MAX_CATALOGO_IMAGENES_LOTE_REGISTROS = 2000;
export const MAX_CATALOGO_IMAGEN_MANIFEST_BYTES = 20_000_000;
export const MAX_CATALOGO_IMAGEN_MANIFEST_REGISTROS = 100_000;

import type { CatalogoListaConImagen } from './catalogo-admin.repository';

export interface CatalogImageUpload {
  buffer: Buffer;
  originalname: string;
  size: number;
}

export const CATALOGO_IMAGE_IMPORT_PORT = Symbol('CATALOGO_IMAGE_IMPORT_PORT');

export interface CatalogImageManifestRecord {
  lista: CatalogoListaConImagen;
  id: string;
  sha256: string | null;
}

export interface CatalogImageCounts {
  articulos: number;
  marcas: number;
  proveedores: number;
  rubros: number;
}

export interface CatalogImageManifestResult {
  requiredHashes: string[];
  imagesReused: number;
  updated: CatalogImageCounts;
}

export interface CatalogImageBatchResult {
  updated: CatalogImageCounts;
  imagesUploaded: number;
  imagesReused: number;
}

export interface CatalogImageImportPort {
  parseImportImageManifest(value: unknown): CatalogImageManifestRecord[];
  applyImportImageManifest(
    empresaId: number,
    records: CatalogImageManifestRecord[],
  ): Promise<CatalogImageManifestResult>;
  applyImageBatch(
    empresaId: number,
    records: unknown,
    files: CatalogImageUpload[] | undefined,
  ): Promise<CatalogImageBatchResult>;
}
