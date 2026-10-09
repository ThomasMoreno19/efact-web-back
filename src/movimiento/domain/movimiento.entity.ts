export class Movimiento {
  private constructor(
    private readonly _id: number,
    private readonly _idEmpresa: number,
    private _idEquipo: number,
    private _estado: string | null,
    private _fecha: string | null,
    private _observacion: string | null,
  ) {}

  static create(data: {
    id: number;
    idEmpresa: number;
    idEquipo: number;
    estado?: string | null;
    fecha?: string | null;
    observacion?: string | null;
  }): Movimiento {
    return new Movimiento(
      data.id,
      data.idEmpresa,
      data.idEquipo,
      data.estado ?? null,
      data.fecha ?? null,
      data.observacion ?? null,
    );
  }

  static rehydrate(data: {
    id: number;
    idEmpresa: number;
    idEquipo: number;
    estado: string | null;
    fecha: string | null;
    observacion: string | null;
  }): Movimiento {
    return new Movimiento(
      data.id,
      data.idEmpresa,
      data.idEquipo,
      data.estado,
      data.fecha,
      data.observacion,
    );
  }

  update(data: {
    idEquipo?: number;
    estado?: string | null;
    fecha?: string | null;
    observacion?: string | null;
  }): void {
    if (data.idEquipo !== undefined) this._idEquipo = data.idEquipo;
    if (data.estado !== undefined) this._estado = data.estado;
    if (data.fecha !== undefined) this._fecha = data.fecha;
    if (data.observacion !== undefined) this._observacion = data.observacion;
  }

  get id(): number {
    return this._id;
  }

  get idEmpresa(): number {
    return this._idEmpresa;
  }

  get idEquipo(): number {
    return this._idEquipo;
  }

  get estado(): string | null {
    return this._estado;
  }

  get fecha(): string | null {
    return this._fecha;
  }

  get observacion(): string | null {
    return this._observacion;
  }
}
