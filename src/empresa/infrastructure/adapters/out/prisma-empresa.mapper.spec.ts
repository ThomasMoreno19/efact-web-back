/// <reference types="jest" />

import type { Empresa as PrismaEmpresa } from '@prisma/client';
import { Empresa } from '../../../domain/empresa.entity';
import { PrismaEmpresaMapper } from './prisma-empresa.mapper';

describe('PrismaEmpresaMapper timestamps', () => {
  it('maps a UTC instant to the Argentina calendar date in the legacy API field', () => {
    const empresa = {
      id: 1,
      nombre: 'Empresa de prueba',
      slug: 'empresa-de-prueba',
      telefono: null,
      ubicacion: null,
      tieneCarrito: true,
       habilitarExcel: true,
      logoUrl: null,
      createdAt: new Date('2026-01-01T02:30:00.000Z'),
      updatedAt: null,
      imagenesEnArticulos: true,
      incluirHorarios: false,
      pedidosFueraHorario: false,
      incluirCodigoBarra: false,
      toleranciaMinDias: null,
      toleranciaMaxDias: null,
    } as PrismaEmpresa;

    expect(PrismaEmpresaMapper.toDomain(empresa).fecha_creacion).toBe(
      '2025-12-31',
    );
    expect(PrismaEmpresaMapper.toDomain(empresa).slug).toBe(
      'empresa-de-prueba',
    );
  });

  it('stores an API date-only value as midnight in Argentina, represented in UTC', () => {
    const empresa = Empresa.create({
      nombre: 'Empresa de prueba',
      slug: 'empresa-de-prueba',
      fecha_creacion: '2025-12-31',
      configuracion: { tieneCarrito: true },
    });

    expect(PrismaEmpresaMapper.toPersistence(empresa).createdAt).toEqual(
      new Date('2025-12-31T03:00:00.000Z'),
    );
  });

  it('leaves createdAt unset so MySQL supplies the current UTC timestamp', () => {
    const empresa = Empresa.create({
      nombre: 'Empresa de prueba',
      slug: 'empresa-de-prueba',
      configuracion: { tieneCarrito: true },
    });

    expect(PrismaEmpresaMapper.toPersistence(empresa)).not.toHaveProperty(
      'createdAt',
    );
  });

  it('persists the company slug', () => {
    const empresa = Empresa.create({
      nombre: 'Empresa de prueba',
      slug: 'empresa-de-prueba',
      configuracion: { tieneCarrito: true },
    });

    expect(PrismaEmpresaMapper.toPersistence(empresa).slug).toBe(
      'empresa-de-prueba',
    );
  });
});
