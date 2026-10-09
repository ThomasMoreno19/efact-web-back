import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MovimientoRepository } from '../../../application/ports/movimiento.repository';
import { Movimiento } from '../../../domain/movimiento.entity';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { translatePrismaError } from '@/shared/infrastructure/prisma/translate-prisma-error';
import { PrismaMovimientoMapper } from './prisma-movimiento.mapper';
import type {
  MovimientoAdminPage,
  MovimientoAdminRecord,
  MovimientoReparacionPublicoRecord,
} from '../../../application/ports/movimiento.repository';

const movimientoSelect = {
  id: true,
  id_empresa: true,
  id_equipo: true,
  estado: true,
  fecha: true,
  observacion: true,
} satisfies Prisma.MovimientoSelect;

const reparacionPublicaEquipoSelect = {
  nombre_equipo: true,
  marca: true,
  modelo: true,
  nro_serie: true,
  cliente: { select: { nombre: true, contrasena: true } },
  movimiento: {
    orderBy: { id: 'desc' },
    take: 1,
    select: {
      id: true,
      seenAt: true,
      estado: true,
      fecha: true,
      observacion: true,
    },
  },
} satisfies Prisma.EquipoSelect;

type ReparacionPublicaEquipo = Prisma.EquipoGetPayload<{
  select: typeof reparacionPublicaEquipoSelect;
}>;

const movimientoAdminSelect = {
  id: true,
  id_equipo: true,
  estado: true,
  fecha: true,
  observacion: true,
  equipo: {
    select: {
      nombre_equipo: true,
      marca: true,
      modelo: true,
      nro_serie: true,
      cliente: { select: { nombre: true } },
    },
  },
} satisfies Prisma.MovimientoSelect;

type MovimientoAdminDbRecord = Prisma.MovimientoGetPayload<{
  select: typeof movimientoAdminSelect;
}>;

@Injectable()
export class PrismaMovimientoRepository implements MovimientoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(idEmpresa: number): Promise<Movimiento[]> {
    const movimientos = await this.prisma.movimiento.findMany({
      where: { id_empresa: idEmpresa },
      orderBy: { id: 'asc' },
      select: movimientoSelect,
    });
    return movimientos.map((movimiento) =>
      PrismaMovimientoMapper.toDomain(movimiento),
    );
  }

  async findById(idEmpresa: number, id: number): Promise<Movimiento | null> {
    const movimiento = await this.prisma.movimiento.findFirst({
      where: { id, id_empresa: idEmpresa },
      select: movimientoSelect,
    });
    return movimiento ? PrismaMovimientoMapper.toDomain(movimiento) : null;
  }

  async findPage(
    idEmpresa: number,
    offset: number,
    limit: number,
  ): Promise<MovimientoAdminPage> {
    const where = { id_empresa: idEmpresa };
    const [total, movimientos] = await Promise.all([
      this.prisma.movimiento.count({ where }),
      this.prisma.movimiento.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        skip: offset,
        take: limit,
        select: movimientoAdminSelect,
      }),
    ]);
    return {
      records: movimientos.map(mapAdminMovement),
      total,
    };
  }

  async findLatestByCuil(
    idEmpresa: number,
    cuil: string,
  ): Promise<MovimientoReparacionPublicoRecord[]> {
    const equipos = await this.prisma.equipo.findMany({
      where: { id_empresa: idEmpresa, cuil },
      orderBy: { id: 'asc' },
      select: reparacionPublicaEquipoSelect,
    });
    return equipos.flatMap((equipo) => {
      const movimiento = mapPublicMovement(equipo);
      return movimiento ? [movimiento] : [];
    });
  }

  async findLatestBySerial(
    idEmpresa: number,
    numeroSerie: string,
  ): Promise<MovimientoReparacionPublicoRecord[]> {
    const equipo = await this.prisma.equipo.findFirst({
      where: { id_empresa: idEmpresa, nro_serie: numeroSerie },
      orderBy: { id: 'desc' },
      select: reparacionPublicaEquipoSelect,
    });
    if (!equipo) return [];
    const movimiento = mapPublicMovement(equipo);
    return movimiento ? [movimiento] : [];
  }

  async markSeen(
    idEmpresa: number,
    ids: number[],
    seenAt: Date,
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.movimiento.updateMany({
      where: { id_empresa: idEmpresa, id: { in: ids }, seenAt: null },
      data: { seenAt },
    });
  }

  async create(movimiento: Movimiento): Promise<Movimiento> {
    try {
      const created = await this.prisma.movimiento.create({
        data: PrismaMovimientoMapper.toPersistence(movimiento),
        select: movimientoSelect,
      });
      return PrismaMovimientoMapper.toDomain(created);
    } catch (error) {
      translatePrismaError(error);
    }
  }

  async update(
    idEmpresa: number,
    id: number,
    movimiento: Movimiento,
  ): Promise<Movimiento | null> {
    try {
      const result = await this.prisma.movimiento.updateMany({
        where: { id, id_empresa: idEmpresa },
        data: {
          id_equipo: movimiento.idEquipo,
          estado: movimiento.estado,
          fecha: movimiento.fecha
            ? new Date(`${movimiento.fecha}T00:00:00.000Z`)
            : null,
          observacion: movimiento.observacion,
        },
      });
      if (result.count === 0) return null;

      const updated = await this.prisma.movimiento.findUnique({
        where: { id },
        select: movimientoSelect,
      });
      return updated ? PrismaMovimientoMapper.toDomain(updated) : null;
    } catch (error) {
      translatePrismaError(error);
    }
  }

  async delete(idEmpresa: number, id: number): Promise<boolean> {
    try {
      const result = await this.prisma.movimiento.deleteMany({
        where: { id, id_empresa: idEmpresa },
      });
      return result.count > 0;
    } catch (error) {
      translatePrismaError(error, 'delete');
    }
  }
}

function mapPublicMovement(
  equipo: ReparacionPublicaEquipo,
): MovimientoReparacionPublicoRecord | null {
  const movimiento = equipo.movimiento[0];
  if (!movimiento) return null;
  return {
    id: movimiento.id,
    seenAt: movimiento.seenAt,
    nombreCliente: equipo.cliente?.nombre ?? null,
    passwordHash: equipo.cliente?.contrasena ?? null,
    equipo: {
      nombreEquipo: equipo.nombre_equipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      numeroSerie: equipo.nro_serie,
    },
    estado: movimiento.estado,
    fecha: movimiento.fecha?.toISOString().slice(0, 10) ?? null,
    observacion: movimiento.observacion,
  };
}

function mapAdminMovement(
  movimiento: MovimientoAdminDbRecord,
): MovimientoAdminRecord {
  return {
    id: movimiento.id,
    idEquipo: movimiento.id_equipo,
    estado: movimiento.estado,
    fecha: movimiento.fecha?.toISOString().slice(0, 10) ?? null,
    observacion: movimiento.observacion,
    equipo: {
      nombreEquipo: movimiento.equipo.nombre_equipo,
      marca: movimiento.equipo.marca,
      modelo: movimiento.equipo.modelo,
      numeroSerie: movimiento.equipo.nro_serie,
      nombreCliente: movimiento.equipo.cliente?.nombre ?? null,
    },
  };
}
