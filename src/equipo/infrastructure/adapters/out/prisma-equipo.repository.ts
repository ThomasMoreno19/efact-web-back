import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EquipoRepository } from '../../../application/ports/equipo.repository';
import { Equipo } from '../../../domain/equipo.entity';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { translatePrismaError } from '@/shared/infrastructure/prisma/translate-prisma-error';
import {
  READ_CACHE_GROUPS,
  READ_CACHE_TTL_MS,
  ReadCacheService,
} from '@/shared/infrastructure/cache/read-cache.service';
import { PrismaEquipoMapper } from './prisma-equipo.mapper';

@Injectable()
export class PrismaEquipoRepository implements EquipoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readCache: ReadCacheService,
  ) {}

  async findAll(idEmpresa: number): Promise<Equipo[]> {
    const equipos = await this.readCache.getOrLoad(
      `equipos:${idEmpresa}:all`,
      READ_CACHE_GROUPS.equipos(idEmpresa),
      READ_CACHE_TTL_MS,
      () =>
        this.prisma.equipo.findMany({
          where: { id_empresa: idEmpresa },
          orderBy: { id: 'asc' },
        }),
    );
    return equipos.map((equipo) => PrismaEquipoMapper.toDomain(equipo));
  }

  async findById(idEmpresa: number, id: number): Promise<Equipo | null> {
    const equipo = await this.readCache.getOrLoad(
      `equipos:${idEmpresa}:id:${id}`,
      READ_CACHE_GROUPS.equipos(idEmpresa),
      READ_CACHE_TTL_MS,
      () =>
        this.prisma.equipo.findUnique({
          where: { id_id_empresa: { id, id_empresa: idEmpresa } },
        }),
    );
    return equipo ? PrismaEquipoMapper.toDomain(equipo) : null;
  }

  async create(equipo: Equipo): Promise<Equipo> {
    try {
      const created = await this.prisma.equipo.create({
        data: PrismaEquipoMapper.toPersistence(equipo),
      });
      await this.readCache.invalidateEquipment(equipo.idEmpresa);
      return PrismaEquipoMapper.toDomain(created);
    } catch (error) {
      translatePrismaError(error);
    }
  }

  async update(
    idEmpresa: number,
    id: number,
    equipo: Equipo,
  ): Promise<Equipo | null> {
    try {
      const updated = await this.prisma.equipo.update({
        where: { id_id_empresa: { id, id_empresa: idEmpresa } },
        data: {
          marca: equipo.marca,
          modelo: equipo.modelo,
          nombre_equipo: equipo.nombreEquipo,
          createdAt: PrismaEquipoMapper.toDatabaseDate(equipo.createdAt),
          nro_serie: equipo.nroSerie,
          cuil: equipo.cuilCliente,
        },
      });
      await this.readCache.invalidateEquipment(idEmpresa);
      return PrismaEquipoMapper.toDomain(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        return null;
      translatePrismaError(error);
    }
  }

  async delete(idEmpresa: number, id: number): Promise<boolean> {
    try {
      const result = await this.prisma.equipo.deleteMany({
        where: { id, id_empresa: idEmpresa },
      });
      if (result.count > 0) await this.readCache.invalidateEquipment(idEmpresa);
      return result.count > 0;
    } catch (error) {
      translatePrismaError(error, 'delete');
    }
  }
}
