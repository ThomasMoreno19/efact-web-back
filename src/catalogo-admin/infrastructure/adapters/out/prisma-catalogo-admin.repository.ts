import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { translatePrismaError } from '@/shared/infrastructure/prisma/translate-prisma-error';
import type {
  CatalogoAdminRepository,
  CatalogoBusquedaPublica,
  CatalogoLista,
  CatalogoListaConImagen,
  CatalogoPagina,
  CatalogoRegistroActualizacion,
} from '../../../application/ports/catalogo-admin.repository';

@Injectable()
export class PrismaCatalogoAdminRepository implements CatalogoAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    empresaId: number,
    lista: CatalogoLista,
    searchWords: string[],
    offset: number,
    limit: number,
    filters?: CatalogoBusquedaPublica,
  ): Promise<CatalogoPagina> {
    switch (lista) {
      case 'articulos': {
        const where = {
          id_empresa: empresaId,
          AND: [
            ...searchWords.map((word) => ({ nombre: { contains: word } })),
            ...(filters?.codigoProveedor
              ? [{ codigo_proveedor: { contains: filters.codigoProveedor } }]
              : []),
            ...(filters?.codigoInterno !== undefined
              ? [{ codigo_interno: filters.codigoInterno }]
              : []),
            ...(filters?.codigoBarra
              ? [{ codigo_barra: filters.codigoBarra }]
              : []),
            ...(filters?.articuloIds?.length
              ? [{ id: { in: filters.articuloIds } }]
              : []),
            ...(filters?.soloOfertas ? [{ oferta: true }] : []),
            ...(filters?.marcaIds?.length
              ? [{ id_marca: { in: filters.marcaIds } }]
              : []),
            ...(filters?.rubroIds?.length
              ? [{ id_rubro: { in: filters.rubroIds } }]
              : []),
          ],
        };
        const select = {
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
          minima_existencia: true,
          maxima_existencia: true,
          tiene_existencia: true,
          no_procesado: true,
          oferta: true,
          actualizado_en: true,
          marca: { select: { nombre: true } },
          rubro: { select: { nombre: true } },
        };

        if (filters?.codigoInterno !== undefined) {
          const articulo = await this.prisma.articulo.findFirst({
            where,
            orderBy: { id: 'asc' },
            select,
          });
          const records = articulo ? [mapArticulo(articulo)] : [];
          return {
            records,
            hasMore: false,
            total: records.length,
          };
        }

        const [articulos, total] = await Promise.all([
          this.prisma.articulo.findMany({
            where,
            orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
            skip: offset,
            take: limit + 1,
            select,
          }),
          this.prisma.articulo.count({ where }),
        ]);
        return toPage(articulos.map(mapArticulo), limit, total);
      }
      case 'marcas': {
        const where = {
          id_empresa: empresaId,
          AND: searchWords.map((word) => ({ nombre: { contains: word } })),
        };
        const [records, total] = await Promise.all([
          this.prisma.marca.findMany({
            where,
            orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
            skip: offset,
            take: limit + 1,
            select: {
              id: true,
              nombre: true,
              abreviatura: true,
              logo_url: true,
            },
          }),
          this.prisma.marca.count({ where }),
        ]);
        return toPage(records, limit, total);
      }
      case 'proveedores': {
        const where = {
          id_empresa: empresaId,
          AND: searchWords.map((word) => ({ nombre: { contains: word } })),
        };
        const [records, total] = await Promise.all([
          this.prisma.proveedor.findMany({
            where,
            orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
            skip: offset,
            take: limit + 1,
            select: { id: true, nombre: true, abreviatura: true },
          }),
          this.prisma.proveedor.count({ where }),
        ]);
        return toPage(records, limit, total);
      }
      case 'rubros': {
        const where = {
          id_empresa: empresaId,
          AND: searchWords.map((word) => ({ nombre: { contains: word } })),
        };
        const [records, total] = await Promise.all([
          this.prisma.rubro.findMany({
            where,
            orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
            skip: offset,
            take: limit + 1,
            select: {
              id: true,
              nombre: true,
              abreviatura: true,
              logo_url: true,
            },
          }),
          this.prisma.rubro.count({ where }),
        ]);
        return toPage(records, limit, total);
      }
      case 'ubicaciones': {
        const where = {
          id_empresa: empresaId,
          AND: searchWords.map((word) => ({
            descripcion: { contains: word },
          })),
        };
        const [records, total] = await Promise.all([
          this.prisma.ubicacion.findMany({
            where,
            orderBy: [{ descripcion: 'asc' }, { id: 'asc' }],
            skip: offset,
            take: limit + 1,
            select: { id: true, descripcion: true },
          }),
          this.prisma.ubicacion.count({ where }),
        ]);
        return toPage(records, limit, total);
      }
    }
  }

  async update(
    empresaId: number,
    lista: CatalogoLista,
    id: string,
    data: CatalogoRegistroActualizacion,
  ): Promise<unknown> {
    try {
      switch (lista) {
        case 'articulos': {
          const articulo = await this.prisma.articulo.update({
            where: { id_id_empresa: { id: BigInt(id), id_empresa: empresaId } },
            data: pickArticleUpdate(data),
          });
          return {
            ...articulo,
            id: articulo.id.toString(),
            precio1: articulo.precio1?.toNumber() ?? null,
            precio2: articulo.precio2?.toNumber() ?? null,
            precio3: articulo.precio3?.toNumber() ?? null,
          };
        }
        case 'marcas':
          return await this.prisma.marca.update({
            where: { id_id_empresa: { id: Number(id), id_empresa: empresaId } },
            data: pickLookupUpdate(data),
            select: {
              id: true,
              nombre: true,
              abreviatura: true,
              logo_url: true,
            },
          });
        case 'proveedores':
          return await this.prisma.proveedor.update({
            where: { id_id_empresa: { id: Number(id), id_empresa: empresaId } },
            data: pickLookupUpdate(data),
            select: { id: true, nombre: true, abreviatura: true },
          });
        case 'rubros':
          return await this.prisma.rubro.update({
            where: { id_id_empresa: { id: Number(id), id_empresa: empresaId } },
            data: pickLookupUpdate(data),
            select: {
              id: true,
              nombre: true,
              abreviatura: true,
              logo_url: true,
            },
          });
        case 'ubicaciones':
          return await this.prisma.ubicacion.update({
            where: { id_id_empresa: { id: Number(id), id_empresa: empresaId } },
            data:
              data.descripcion === undefined
                ? {}
                : { descripcion: data.descripcion },
            select: { id: true, descripcion: true },
          });
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return null;
      }
      translatePrismaError(error);
    }
  }

  async findImageUrl(
    empresaId: number,
    lista: CatalogoListaConImagen,
    id: string,
  ): Promise<string | null | undefined> {
    switch (lista) {
      case 'articulos': {
        const record = await this.prisma.articulo.findUnique({
          where: { id_id_empresa: { id: BigInt(id), id_empresa: empresaId } },
          select: { logo_url: true },
        });
        return record?.logo_url;
      }
      case 'marcas': {
        const record = await this.prisma.marca.findUnique({
          where: { id_id_empresa: { id: Number(id), id_empresa: empresaId } },
          select: { logo_url: true },
        });
        return record?.logo_url;
      }
      case 'proveedores': {
        const record = await this.prisma.proveedor.findUnique({
          where: { id_id_empresa: { id: Number(id), id_empresa: empresaId } },
          select: { logo_url: true },
        });
        return record?.logo_url;
      }
      case 'rubros': {
        const record = await this.prisma.rubro.findUnique({
          where: { id_id_empresa: { id: Number(id), id_empresa: empresaId } },
          select: { logo_url: true },
        });
        return record?.logo_url;
      }
    }
  }

  async delete(
    empresaId: number,
    lista: CatalogoLista,
    id: string,
  ): Promise<boolean> {
    try {
      let deletedCount = 0;
      switch (lista) {
        case 'articulos':
          deletedCount = (
            await this.prisma.articulo.deleteMany({
              where: { id: BigInt(id), id_empresa: empresaId },
            })
          ).count;
          break;
        case 'marcas':
          deletedCount = (
            await this.prisma.marca.deleteMany({
              where: { id: Number(id), id_empresa: empresaId },
            })
          ).count;
          break;
        case 'proveedores':
          deletedCount = (
            await this.prisma.proveedor.deleteMany({
              where: { id: Number(id), id_empresa: empresaId },
            })
          ).count;
          break;
        case 'rubros':
          deletedCount = (
            await this.prisma.rubro.deleteMany({
              where: { id: Number(id), id_empresa: empresaId },
            })
          ).count;
          break;
        case 'ubicaciones':
          deletedCount = (
            await this.prisma.ubicacion.deleteMany({
              where: { id: Number(id), id_empresa: empresaId },
            })
          ).count;
          break;
      }
      return deletedCount > 0;
    } catch (error) {
      translatePrismaError(error, 'delete');
    }
  }
}

function toPage<T>(records: T[], limit: number, total: number): CatalogoPagina {
  return {
    records: records.slice(0, limit),
    hasMore: records.length > limit,
    total,
  };
}

function mapArticulo(articulo: {
  id: bigint;
  precio1: Prisma.Decimal | null;
  precio2: Prisma.Decimal | null;
  precio3: Prisma.Decimal | null;
  [key: string]: unknown;
}) {
  return {
    ...articulo,
    id: articulo.id.toString(),
    precio1: articulo.precio1?.toNumber() ?? null,
    precio2: articulo.precio2?.toNumber() ?? null,
    precio3: articulo.precio3?.toNumber() ?? null,
  };
}

function pickArticleUpdate(data: CatalogoRegistroActualizacion) {
  return {
    ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
    ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
    ...(data.codigo_interno !== undefined
      ? { codigo_interno: data.codigo_interno }
      : {}),
    ...(data.codigo_barra !== undefined
      ? { codigo_barra: data.codigo_barra }
      : {}),
    ...(data.precio1 !== undefined ? { precio1: data.precio1 } : {}),
    ...(data.precio2 !== undefined ? { precio2: data.precio2 } : {}),
    ...(data.precio3 !== undefined ? { precio3: data.precio3 } : {}),
    ...(data.existencia !== undefined ? { existencia: data.existencia } : {}),
    ...(data.minima_existencia !== undefined
      ? { minima_existencia: data.minima_existencia }
      : {}),
    ...(data.maxima_existencia !== undefined
      ? { maxima_existencia: data.maxima_existencia }
      : {}),
    ...(data.tiene_existencia !== undefined
      ? { tiene_existencia: data.tiene_existencia }
      : {}),
    ...(data.no_procesado !== undefined
      ? { no_procesado: data.no_procesado }
      : {}),
    ...(data.oferta !== undefined ? { oferta: data.oferta } : {}),
  } satisfies Prisma.ArticuloUncheckedUpdateInput;
}

function pickLookupUpdate(data: CatalogoRegistroActualizacion) {
  return {
    ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
    ...(data.abreviatura !== undefined
      ? { abreviatura: data.abreviatura }
      : {}),
    ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
  };
}
