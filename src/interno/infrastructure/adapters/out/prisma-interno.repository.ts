import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import {
  READ_CACHE_GROUPS,
  READ_CACHE_TTL_MS,
  ReadCacheService,
} from '@/shared/infrastructure/cache/read-cache.service';
import type {
  CatalogoInternoArticulo,
  CatalogoInternoCategoria,
  CatalogoInternoFiltros,
  CatalogoInternoPagina,
  InternoRepository,
  SaldoInternoCliente,
} from '../../../application/ports/interno.repository';

const INTERNAL_ARTICLE_SELECT = {
  id: true,
  codigo_interno: true,
  codigo_proveedor: true,
  codigo_barra: true,
  nombre: true,
  logo_url: true,
  precio1: true,
  precio2: true,
  precio3: true,
  existencia: true,
  tiene_existencia: true,
  minima_existencia: true,
  maxima_existencia: true,
  oferta: true,
  actualizado_en: true,
  marca: { select: { id: true, nombre: true } },
  rubro: { select: { id: true, nombre: true } },
  proveedor: { select: { id: true, nombre: true } },
  ubicacion: { select: { id: true, descripcion: true } },
} satisfies Prisma.ArticuloSelect;

@Injectable()
export class PrismaInternoRepository implements InternoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readCache: ReadCacheService,
  ) {}

  async findCatalogoPage(
    idEmpresa: number,
    offset: number,
    limit: number,
    filters: CatalogoInternoFiltros,
  ): Promise<CatalogoInternoPagina> {
    const normalizedFilters = {
      lista: filters.lista,
      searchWords: filters.searchWords,
      codigoProveedor: filters.codigoProveedor ?? null,
      codigoInterno: filters.codigoInterno ?? null,
      codigoBarra: filters.codigoBarra ?? null,
      marcaIds: [...filters.marcaIds].sort((left, right) => left - right),
      rubroIds: [...filters.rubroIds].sort((left, right) => left - right),
      proveedorIds: [...filters.proveedorIds].sort(
        (left, right) => left - right,
      ),
      ubicacionIds: [...filters.ubicacionIds].sort(
        (left, right) => left - right,
      ),
    };
    const cacheKey = `catalogo:interno:${JSON.stringify({
      offset,
      limit,
      filters: normalizedFilters,
    })}`;
    const catalogTable =
      filters.lista === 'ofertas' ? 'articulos' : filters.lista;
    return this.readCache.getOrLoad(
      cacheKey,
      READ_CACHE_GROUPS.catalogo(idEmpresa, catalogTable),
      READ_CACHE_TTL_MS,
      () =>
        this.findCatalogoPageFromDatabase(idEmpresa, offset, limit, filters),
    );
  }

  private async findCatalogoPageFromDatabase(
    idEmpresa: number,
    offset: number,
    limit: number,
    filters: CatalogoInternoFiltros,
  ): Promise<CatalogoInternoPagina> {
    if (filters.lista === 'marcas') {
      const where = {
        id_empresa: idEmpresa,
        AND: filters.searchWords.map((word) => ({
          nombre: { contains: word },
        })),
      };
      const [records, total] = await Promise.all([
        this.prisma.marca.findMany({
          where,
          orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
          skip: offset,
          take: limit,
          select: { id: true, nombre: true, logo_url: true },
        }),
        this.prisma.marca.count({ where }),
      ]);
      return { records: records.map(mapCategory), total };
    }

    if (filters.lista === 'rubros') {
      const where = {
        id_empresa: idEmpresa,
        AND: filters.searchWords.map((word) => ({
          nombre: { contains: word },
        })),
      };
      const [records, total] = await Promise.all([
        this.prisma.rubro.findMany({
          where,
          orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
          skip: offset,
          take: limit,
          select: { id: true, nombre: true, logo_url: true },
        }),
        this.prisma.rubro.count({ where }),
      ]);
      return { records: records.map(mapCategory), total };
    }

    if (filters.lista === 'proveedores') {
      const where = {
        id_empresa: idEmpresa,
        AND: filters.searchWords.map((word) => ({
          nombre: { contains: word },
        })),
      };
      const [records, total] = await Promise.all([
        this.prisma.proveedor.findMany({
          where,
          orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
          skip: offset,
          take: limit,
          select: { id: true, nombre: true, logo_url: true },
        }),
        this.prisma.proveedor.count({ where }),
      ]);
      return { records: records.map(mapCategory), total };
    }

    if (filters.lista === 'ubicaciones') {
      const where = {
        id_empresa: idEmpresa,
        AND: filters.searchWords.map((word) => ({
          descripcion: { contains: word },
        })),
      };
      const [records, total] = await Promise.all([
        this.prisma.ubicacion.findMany({
          where,
          orderBy: [{ descripcion: 'asc' }, { id: 'asc' }],
          skip: offset,
          take: limit,
          select: { id: true, descripcion: true },
        }),
        this.prisma.ubicacion.count({ where }),
      ]);
      return {
        records: records.map((record) => ({
          id: record.id,
          nombre: record.descripcion,
          logoUrl: null,
        })),
        total,
      };
    }

    const where: Prisma.ArticuloWhereInput = {
      id_empresa: idEmpresa,
      AND: [
        ...filters.searchWords.map((word) => ({ nombre: { contains: word } })),
        ...(filters.codigoProveedor
          ? [{ codigo_proveedor: { contains: filters.codigoProveedor } }]
          : []),
        ...(filters.codigoInterno !== undefined
          ? [{ codigo_interno: filters.codigoInterno }]
          : []),
        ...(filters.codigoBarra ? [{ codigo_barra: filters.codigoBarra }] : []),
        ...(filters.marcaIds.length > 0
          ? [{ id_marca: { in: filters.marcaIds } }]
          : []),
        ...(filters.rubroIds.length > 0
          ? [{ id_rubro: { in: filters.rubroIds } }]
          : []),
        ...(filters.proveedorIds.length > 0
          ? [{ id_proveedor: { in: filters.proveedorIds } }]
          : []),
        ...(filters.ubicacionIds.length > 0
          ? [{ id_ubicacion: { in: filters.ubicacionIds } }]
          : []),
        ...(filters.lista === 'ofertas' ? [{ oferta: true }] : []),
      ],
    };
    const [articulos, total] = await Promise.all([
      this.prisma.articulo.findMany({
        where,
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
        select: INTERNAL_ARTICLE_SELECT,
      }),
      this.prisma.articulo.count({ where }),
    ]);
    return { records: articulos.map(mapCatalogoArticulo), total };
  }

  async findSaldos(idEmpresa: number): Promise<SaldoInternoCliente[]> {
    return this.readCache.getOrLoad(
      `clientes:${idEmpresa}:saldos-internos`,
      READ_CACHE_GROUPS.clientes(idEmpresa),
      READ_CACHE_TTL_MS,
      async () => {
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
      },
    );
  }
}

function mapCategory(record: {
  id: number;
  nombre: string;
  logo_url: string | null;
}): CatalogoInternoCategoria {
  return { id: record.id, nombre: record.nombre, logoUrl: record.logo_url };
}

function mapCatalogoArticulo(
  articulo: Prisma.ArticuloGetPayload<{
    select: typeof INTERNAL_ARTICLE_SELECT;
  }>,
): CatalogoInternoArticulo {
  return {
    id: articulo.id.toString(),
    codigoInterno: articulo.codigo_interno,
    codigoProveedor: articulo.codigo_proveedor,
    codigoBarra: articulo.codigo_barra,
    nombre: articulo.nombre,
    logoUrl: articulo.logo_url,
    precio1: articulo.precio1?.toNumber() ?? null,
    precio2: articulo.precio2?.toNumber() ?? null,
    precio3: articulo.precio3?.toNumber() ?? null,
    existencia: articulo.existencia,
    tieneExistencia: articulo.tiene_existencia,
    minimaExistencia: articulo.minima_existencia,
    maximaExistencia: articulo.maxima_existencia,
    oferta: articulo.oferta,
    actualizadoEn: articulo.actualizado_en?.toISOString().slice(0, 10) ?? null,
    marca: articulo.marca,
    rubro: articulo.rubro,
    proveedor: articulo.proveedor,
    ubicacion: articulo.ubicacion
      ? { id: articulo.ubicacion.id, nombre: articulo.ubicacion.descripcion }
      : null,
  };
}
