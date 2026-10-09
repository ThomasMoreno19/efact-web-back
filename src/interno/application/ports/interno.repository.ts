export const INTERNO_REPOSITORY = Symbol('INTERNO_REPOSITORY');

export interface CatalogoInternoArticulo {
  id: string;
  codigoInterno: number;
  nombre: string;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  existencia: number;
  tieneExistencia: boolean;
}

export interface CatalogoInternoPagina {
  records: CatalogoInternoArticulo[];
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
  ): Promise<CatalogoInternoPagina>;
  findSaldos(idEmpresa: number): Promise<SaldoInternoCliente[]>;
}
