import { Movimiento } from '../../domain/movimiento.entity';

export class MovimientoMapper {
  static toDomain(data: {
    id: number;
    idEmpresa: number;
    idEquipo: number;
    estado?: string | null;
    fecha?: string | null;
    observacion?: string | null;
  }): Movimiento {
    return Movimiento.create(data);
  }

  static toResponse(movimiento: Movimiento) {
    return {
      id: movimiento.id,
      idEmpresa: movimiento.idEmpresa,
      idEquipo: movimiento.idEquipo,
      estado: movimiento.estado,
      fecha: movimiento.fecha,
      observacion: movimiento.observacion,
    };
  }
}
