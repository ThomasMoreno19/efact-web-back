import { Prisma } from '@prisma/client';
import { Equipo } from '../../../domain/equipo.entity';

export class PrismaEquipoMapper {
  static toDomain(record: {
    id: number;
    id_empresa: number;
    marca: string | null;
    modelo: string | null;
    nombre_equipo: string | null;
    createdAt: Date | null;
    nro_serie: string | null;
    cuil: string | null;
  }): Equipo {
    return Equipo.rehydrate({
      id: record.id,
      idEmpresa: record.id_empresa,
      marca: record.marca,
      modelo: record.modelo,
      nombreEquipo: record.nombre_equipo,
      createdAt: record.createdAt?.toISOString().slice(0, 10) ?? null,
      nroSerie: record.nro_serie,
      cuilCliente: record.cuil,
    });
  }

  static toPersistence(equipo: Equipo): Prisma.EquipoUncheckedCreateInput {
    return {
      id: equipo.id,
      id_empresa: equipo.idEmpresa,
      marca: equipo.marca,
      modelo: equipo.modelo,
      nombre_equipo: equipo.nombreEquipo,
      createdAt: PrismaEquipoMapper.toDatabaseDate(equipo.createdAt),
      nro_serie: equipo.nroSerie,
      cuil: equipo.cuilCliente,
    };
  }

  static toDatabaseDate(date: string | null): Date | null {
    return date ? new Date(`${date}T00:00:00.000Z`) : null;
  }
}
