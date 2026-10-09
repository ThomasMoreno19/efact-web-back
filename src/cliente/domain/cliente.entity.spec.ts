/// <reference types="jest" />

import { Cliente } from './cliente.entity';

describe('Cliente', () => {
  it('defaults optional balance, update timestamp and password to null', () => {
    const cliente = Cliente.create({
      idEmpresa: 12,
      cuil: '20-12345678-6',
    });

    expect(cliente.saldo).toBeNull();
    expect(cliente.updatedAt).toBeNull();
    expect(cliente.passwordHash).toBeNull();
  });

  it('creates a client scoped to an empresa with an integer balance', () => {
    const cliente = Cliente.create({
      idEmpresa: 12,
      cuil: '20-12345678-6',
      nombre: 'Cliente de prueba',
      saldo: -250,
      passwordHash: '$2b$10$hash',
    });

    expect(cliente.idEmpresa).toBe(12);
    expect(cliente.cuil.valor).toBe('20123456786');
    expect(cliente.nombre).toBe('Cliente de prueba');
    expect(cliente.saldo).toBe(-250);
    expect(cliente.updatedAt).toBeNull();
    expect(cliente.passwordHash).toBe('$2b$10$hash');
  });

  it('preserves omitted fields and accepts null saldo', () => {
    const cliente = Cliente.create({
      idEmpresa: 12,
      cuil: '20-12345678-6',
      nombre: 'Cliente de prueba',
      saldo: 250,
    });

    cliente.update({ saldo: null });

    expect(cliente.cuil.valor).toBe('20123456786');
    expect(cliente.nombre).toBe('Cliente de prueba');
    expect(cliente.saldo).toBeNull();
  });

  it('rejects a non-integer saldo', () => {
    expect(() =>
      Cliente.create({
        idEmpresa: 12,
        cuil: '20-12345678-6',
        saldo: 1.5,
      }),
    ).toThrow('El saldo debe ser un número entero dentro del rango permitido.');
  });

  it('rehydrates the stored update date', () => {
    const cliente = Cliente.rehydrate({
      idEmpresa: 12,
      cuil: '20-12345678-6',
      nombre: null,
      saldo: null,
      updatedAt: '2025-02-03',
      passwordHash: null,
      domicilio: null,
      localidad: null,
      telefonos: null,
    });

    expect(cliente.updatedAt).toBe('2025-02-03');
  });
});
