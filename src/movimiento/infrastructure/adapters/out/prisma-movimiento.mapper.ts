import type { Prisma } from '@prisma/client';
import { Movimiento } from '../../../domain/movimiento.entity';

type MovimientoRecord = {
  id: number;
  id_empresa: number;
  id_equipo: number;
  estado: string | null;
  fecha: Date | null;
  observacion: string | null;
};

export class PrismaMovimientoMapper {
  static toDomain(record: MovimientoRecord): Movimiento {
    return Movimiento.rehydrate({
      id: record.id,
      idEmpresa: record.id_empresa,
      idEquipo: record.id_equipo,
      estado: record.estado,
      fecha: record.fecha?.toISOString().slice(0, 10) ?? null,
      observacion: record.observacion,
    });
  }

  static toPersistence(
    movimiento: Movimiento,
  ): Prisma.MovimientoUncheckedCreateInput {
    return {
      id: movimiento.id,
      id_empresa: movimiento.idEmpresa,
      id_equipo: movimiento.idEquipo,
      estado: movimiento.estado,
      fecha: movimiento.fecha
        ? new Date(`${movimiento.fecha}T00:00:00.000Z`)
        : null,
      observacion: movimiento.observacion,
    };
  }
}
