import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import type {
  CatalogoInternoArticulo,
  CatalogoInternoPagina,
  InternoRepository,
  SaldoInternoCliente,
} from '../../../application/ports/interno.repository';

@Injectable()
export class PrismaInternoRepository implements InternoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCatalogoPage(
    idEmpresa: number,
    offset: number,
    limit: number,
  ): Promise<CatalogoInternoPagina> {
    const where = { id_empresa: idEmpresa };
    const [articulos, total] = await Promise.all([
      this.prisma.articulo.findMany({
        where,
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          codigo_interno: true,
          nombre: true,
          precio1: true,
          precio2: true,
          precio3: true,
          existencia: true,
          tiene_existencia: true,
        },
      }),
      this.prisma.articulo.count({ where }),
    ]);
    return {
      records: articulos.map(mapCatalogoArticulo),
      total,
    };
  }

  async findSaldos(idEmpresa: number): Promise<SaldoInternoCliente[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: { idEmpresa },
      orderBy: [{ nombre: 'asc' }, { cuil: 'asc' }],
      select: { nombre: true, saldo: true, updatedAt: true },
    });
    return clientes.map((cliente) => ({
      nombre: cliente.nombre,
      saldo: cliente.saldo,
      updatedAt: cliente.updatedAt?.toISOString().slice(0, 10) ?? null,
    }));
  }
}

function mapCatalogoArticulo(articulo: {
  id: bigint;
  codigo_interno: number;
  nombre: string;
  precio1: { toNumber(): number } | null;
  precio2: { toNumber(): number } | null;
  precio3: { toNumber(): number } | null;
  existencia: number;
  tiene_existencia: boolean;
}): CatalogoInternoArticulo {
  return {
    id: articulo.id.toString(),
    codigoInterno: articulo.codigo_interno,
    nombre: articulo.nombre,
    precio1: articulo.precio1?.toNumber() ?? null,
    precio2: articulo.precio2?.toNumber() ?? null,
    precio3: articulo.precio3?.toNumber() ?? null,
    existencia: articulo.existencia,
    tieneExistencia: articulo.tiene_existencia,
  };
}
