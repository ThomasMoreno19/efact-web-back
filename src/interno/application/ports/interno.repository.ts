export const INTERNO_REPOSITORY = Symbol('INTERNO_REPOSITORY');

export type CatalogoInternoLista =
  | 'articulos'
  | 'marcas'
  | 'rubros'
  | 'ofertas'
  | 'proveedores'
  | 'ubicaciones';

export interface CatalogoInternoFiltros {
  lista: CatalogoInternoLista;
  searchWords: string[];
  codigoProveedor?: string;
  codigoInterno?: number;
  codigoBarra?: string;
  marcaIds: number[];
  rubroIds: number[];
  proveedorIds: number[];
  ubicacionIds: number[];
}

export interface CatalogoInternoCategoria {
  id: number;
  nombre: string;
  logoUrl: string | null;
}

export interface CatalogoInternoRelacion {
  id: number;
  nombre: string;
}

export interface CatalogoInternoArticulo {
  id: string;
  codigoInterno: number;
  codigoProveedor: string | null;
  codigoBarra: string | null;
  nombre: string;
  logoUrl: string | null;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  existencia: number;
  tieneExistencia: boolean;
  minimaExistencia: number | null;
  maximaExistencia: number | null;
  oferta: boolean;
  actualizadoEn: string | null;
  marca: CatalogoInternoRelacion | null;
  rubro: CatalogoInternoRelacion | null;
  proveedor: CatalogoInternoRelacion | null;
  ubicacion: CatalogoInternoRelacion | null;
}

export interface CatalogoInternoPagina {
  records: Array<CatalogoInternoArticulo | CatalogoInternoCategoria>;
  total: number;
}

export interface SaldoInternoCliente {
  nombre: string | null;
  saldo: number | null;
  updatedAt: string | null;
}

export interface InternoRepository {
  findCatalogoPage(
    idEmpresa: number,
    offset: number,
    limit: number,
    filters: CatalogoInternoFiltros,
  ): Promise<CatalogoInternoPagina>;
  findSaldos(idEmpresa: number): Promise<SaldoInternoCliente[]>;
}
