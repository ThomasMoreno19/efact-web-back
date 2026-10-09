export class Equipo {
  private constructor(
    private readonly _id: number,
    private readonly _idEmpresa: number,
    private _marca: string | null,
    private _modelo: string | null,
    private _nombreEquipo: string | null,
    private _createdAt: string | null,
    private _nroSerie: string | null,
    private _cuilCliente: string | null,
  ) {}

  static create(data: {
    id: number;
    idEmpresa: number;
    marca?: string | null;
    modelo?: string | null;
    nombreEquipo?: string | null;
    createdAt?: string | null;
    nroSerie?: string | null;
    cuilCliente?: string | null;
  }): Equipo {
    return new Equipo(
      data.id,
      data.idEmpresa,
      data.marca ?? null,
      data.modelo ?? null,
      data.nombreEquipo ?? null,
      data.createdAt ?? null,
      data.nroSerie ?? null,
      data.cuilCliente ?? null,
    );
  }

  static rehydrate(data: {
    id: number;
    idEmpresa: number;
    marca: string | null;
    modelo: string | null;
    nombreEquipo: string | null;
    createdAt: string | null;
    nroSerie: string | null;
    cuilCliente: string | null;
  }): Equipo {
    return new Equipo(
      data.id,
      data.idEmpresa,
      data.marca,
      data.modelo,
      data.nombreEquipo,
      data.createdAt,
      data.nroSerie,
      data.cuilCliente,
    );
  }

  update(data: {
    marca?: string | null;
    modelo?: string | null;
    nombreEquipo?: string | null;
    createdAt?: string | null;
    nroSerie?: string | null;
    cuilCliente?: string | null;
  }): void {
    if (data.marca !== undefined) this._marca = data.marca;
    if (data.modelo !== undefined) this._modelo = data.modelo;
    if (data.nombreEquipo !== undefined) this._nombreEquipo = data.nombreEquipo;
    if (data.createdAt !== undefined) this._createdAt = data.createdAt;
    if (data.nroSerie !== undefined) this._nroSerie = data.nroSerie;
    if (data.cuilCliente !== undefined) this._cuilCliente = data.cuilCliente;
  }

  get id(): number {
    return this._id;
  }
  get idEmpresa(): number {
    return this._idEmpresa;
  }
  get marca(): string | null {
    return this._marca;
  }
  get modelo(): string | null {
    return this._modelo;
  }
  get nombreEquipo(): string | null {
    return this._nombreEquipo;
  }
  get createdAt(): string | null {
    return this._createdAt;
  }
  get nroSerie(): string | null {
    return this._nroSerie;
  }
  get cuilCliente(): string | null {
    return this._cuilCliente;
  }
}
