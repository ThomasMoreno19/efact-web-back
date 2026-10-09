/// <reference types="jest" />

import { ConfiguracionEmpresa } from './configuracion-empresa.value-object';

describe('ConfiguracionEmpresa', () => {
  it('applies defaults to optional settings', () => {
    const configuracion = ConfiguracionEmpresa.create({});

    expect(configuracion.tieneCarrito).toBe(true);
    expect(configuracion.habilitarExcel).toBe(true);
    expect(configuracion.imagenesEnArticulos).toBe(true);
    expect(configuracion.incluirHorarios).toBe(false);
    expect(configuracion.pedidosFueraHorario).toBe(false);
    expect(configuracion.incluirCodigoBarra).toBe(false);
    expect(configuracion.toleranciaMinDias).toBeNull();
    expect(configuracion.toleranciaMaxDias).toBeNull();
  });

  it('allows a minimum tolerance without a maximum tolerance', () => {
    const configuracion = ConfiguracionEmpresa.create({
      toleranciaMinDias: 2,
    });

    expect(configuracion.toleranciaMinDias).toBe(2);
    expect(configuracion.toleranciaMaxDias).toBeNull();
  });

  it('requires a minimum tolerance when a maximum tolerance is provided', () => {
    expect(() => ConfiguracionEmpresa.create({ toleranciaMaxDias: 8 })).toThrow(
      'La tolerancia máxima requiere una tolerancia mínima.',
    );
  });

  it('requires the maximum tolerance to be greater than the minimum', () => {
    expect(() =>
      ConfiguracionEmpresa.create({
        toleranciaMinDias: 8,
        toleranciaMaxDias: 8,
      }),
    ).toThrow('La tolerancia máxima debe ser mayor que la tolerancia mínima.');

    expect(() =>
      ConfiguracionEmpresa.create({
        toleranciaMinDias: 9,
        toleranciaMaxDias: 8,
      }),
    ).toThrow('La tolerancia máxima debe ser mayor que la tolerancia mínima.');
  });

  it('requires tolerances to be integers', () => {
    expect(() =>
      ConfiguracionEmpresa.create({ toleranciaMinDias: 1.5 }),
    ).toThrow('La tolerancia mínima debe ser un número entero.');

    expect(() =>
      ConfiguracionEmpresa.create({
        toleranciaMinDias: 1,
        toleranciaMaxDias: 2.5,
      }),
    ).toThrow('La tolerancia máxima debe ser un número entero.');
  });

  it('updates only provided values and allows clearing tolerances', () => {
    const configuracion = ConfiguracionEmpresa.create({
      tieneCarrito: true,
      habilitarExcel: true,
      incluirHorarios: true,
      toleranciaMinDias: 2,
      toleranciaMaxDias: 8,
    });

    const actualizada = configuracion.update({
      incluirHorarios: false,
      toleranciaMinDias: null,
      toleranciaMaxDias: null,
    });

    expect(actualizada.incluirHorarios).toBe(false);
    expect(actualizada.toleranciaMinDias).toBeNull();
    expect(actualizada.toleranciaMaxDias).toBeNull();
    expect(configuracion.incluirHorarios).toBe(true);
    expect(configuracion.toleranciaMinDias).toBe(2);
  });
});
