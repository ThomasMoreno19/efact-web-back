import { Movimiento } from '../../domain/movimiento.entity';

export const MOVIMIENTO_REPOSITORY = Symbol('MOVIMIENTO_REPOSITORY');

export interface MovimientoReparacionPublicoRecord {
  id: number;
  seenAt: Date | null;
  nombreCliente: string | null;
  passwordHash: string | null;
  equipo: {
    nombreEquipo: string | null;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
  };
  estado: string | null;
  fecha: string | null;
  observacion: string | null;
}

export interface MovimientoAdminRecord {
  id: number;
  idEquipo: number;
  estado: string | null;
  fecha: string | null;
  observacion: string | null;
  equipo: {
    nombreEquipo: string | null;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    nombreCliente: string | null;
  };
}

export interface MovimientoAdminPage {
  records: MovimientoAdminRecord[];
  total: number;
}

export interface MovimientoRepository {
  findAll(idEmpresa: number): Promise<Movimiento[]>;
  findById(idEmpresa: number, id: number): Promise<Movimiento | null>;
  findPage(
    idEmpresa: number,
    offset: number,
    limit: number,
  ): Promise<MovimientoAdminPage>;
  findLatestByCuil(
    idEmpresa: number,
    cuil: string,
  ): Promise<MovimientoReparacionPublicoRecord[]>;
  findLatestBySerial(
    idEmpresa: number,
    numeroSerie: string,
  ): Promise<MovimientoReparacionPublicoRecord[]>;
  markSeen(idEmpresa: number, ids: number[], seenAt: Date): Promise<void>;
  create(movimiento: Movimiento): Promise<Movimiento>;
  update(
    idEmpresa: number,
    id: number,
    movimiento: Movimiento,
  ): Promise<Movimiento | null>;
  delete(idEmpresa: number, id: number): Promise<boolean>;
}
