import type { Empresa as PrismaEmpresa, Prisma } from '@prisma/client';
import { Empresa } from '../../../domain/empresa.entity';

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

function formatArgentinaDate(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

function parseArgentinaDate(value: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (dateOnly) return new Date(`${value}T00:00:00.000-03:00`);

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}-03:00`);
}

export class PrismaEmpresaMapper {
  static toDomain(empresa: PrismaEmpresa): Empresa {
    return Empresa.rehydrate({
      id: empresa.id,
      nombre: empresa.nombre,
      slug: empresa.slug,
      telefono: empresa.telefono,
      ubicacion: empresa.ubicacion,
      logo_url: empresa.logoUrl,
      fecha_creacion: formatArgentinaDate(empresa.createdAt),
      configuracion: {
        tieneCarrito: empresa.tieneCarrito,
        habilitarExcel: Boolean(empresa.habilitarExcel),
        catalogoHabilitado: empresa.catalogoHabilitado,
        saldosHabilitados: empresa.saldosHabilitados,
        reparacionesHabilitadas: empresa.reparacionesHabilitadas,
        imagenesEnArticulos: empresa.imagenesEnArticulos,
        incluirHorarios: empresa.incluirHorarios,
        pedidosFueraHorario: empresa.pedidosFueraHorario,
        incluirCodigoBarra: empresa.incluirCodigoBarra,
        toleranciaMinDias: empresa.toleranciaMinDias,
        toleranciaMaxDias: empresa.toleranciaMaxDias,
      },
    });
  }

  static toPersistence(empresa: Empresa): Prisma.EmpresaUncheckedCreateInput {
    const configuracion = empresa.configuracion;

    return {
      nombre: empresa.nombre,
      slug: empresa.slug,
      telefono: empresa.telefono,
      ubicacion: empresa.ubicacion,
      tieneCarrito: configuracion.tieneCarrito,
      habilitarExcel: configuracion.habilitarExcel,
      catalogoHabilitado: configuracion.catalogoHabilitado,
      saldosHabilitados: configuracion.saldosHabilitados,
      reparacionesHabilitadas: configuracion.reparacionesHabilitadas,
      logoUrl: empresa.logo_url,
      ...(empresa.fecha_creacion
        ? { createdAt: parseArgentinaDate(empresa.fecha_creacion) }
        : {}),
      imagenesEnArticulos: configuracion.imagenesEnArticulos,
      incluirHorarios: configuracion.incluirHorarios,
      pedidosFueraHorario: configuracion.pedidosFueraHorario,
      incluirCodigoBarra: configuracion.incluirCodigoBarra,
      toleranciaMinDias: configuracion.toleranciaMinDias,
      toleranciaMaxDias: configuracion.toleranciaMaxDias,
    };
  }
}
