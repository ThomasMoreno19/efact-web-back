export const CATALOGO_ADMIN_REPOSITORY = Symbol('CATALOGO_ADMIN_REPOSITORY');

export const CatalogoLista = {
  ARTICULOS: 'articulos',
  MARCAS: 'marcas',
  PROVEEDORES: 'proveedores',
  RUBROS: 'rubros',
  UBICACIONES: 'ubicaciones',
} as const;

export type CatalogoLista = (typeof CatalogoLista)[keyof typeof CatalogoLista];
export type CatalogoListaConImagen = Extract<
  CatalogoLista,
  'articulos' | 'marcas' | 'proveedores' | 'rubros'
>;

export interface CatalogoRegistroActualizacion {
  nombre?: string;
  descripcion?: string;
  abreviatura?: string | null;
  logo_url?: string | null;
  codigo_interno?: number;
  codigo_barra?: string | null;
  precio1?: number | null;
  precio2?: number | null;
  precio3?: number | null;
  existencia?: number;
  minima_existencia?: number | null;
  maxima_existencia?: number | null;
  tiene_existencia?: boolean;
  no_procesado?: number;
  oferta?: boolean;
}

export interface CatalogoBusquedaPublica {
  codigoProveedor?: string;
  codigoInterno?: number;
  codigoBarra?: string;
  articuloIds?: bigint[];
  soloOfertas?: boolean;
  marcaIds?: number[];
  rubroIds?: number[];
}

export interface CatalogoPagina {
  records: unknown[];
  hasMore: boolean;
  total: number;
}

export interface CatalogoAdminRepository {
  findAll(
    empresaId: number,
    lista: CatalogoLista,
    searchWords: string[],
    offset: number,
    limit: number,
    filters?: CatalogoBusquedaPublica,
  ): Promise<CatalogoPagina>;
  findImageUrl(
    empresaId: number,
    lista: CatalogoListaConImagen,
    id: string,
  ): Promise<string | null | undefined>;
  update(
    empresaId: number,
    lista: CatalogoLista,
    id: string,
    data: CatalogoRegistroActualizacion,
  ): Promise<unknown>;
  delete(empresaId: number, lista: CatalogoLista, id: string): Promise<boolean>;
}
