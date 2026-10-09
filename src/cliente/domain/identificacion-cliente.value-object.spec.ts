/// <reference types="jest" />

import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';
import { IdentificacionCliente } from './identificacion-cliente.value-object';

describe('IdentificacionCliente', () => {
  it('normalizes DNI, CUIL and CUIT formats to digits', () => {
    expect(IdentificacionCliente.create('12.345.678').valor).toBe('12345678');
    expect(IdentificacionCliente.create('20-12345678-6').valor).toBe(
      '20123456786',
    );
    expect(IdentificacionCliente.create('30-12345678-1').valor).toBe(
      '30123456781',
    );
  });

  it('rejects invalid lengths, prefixes and verification digits', () => {
    for (const value of ['1234', '20-12345678-3', '99123456789']) {
      expect(() => IdentificacionCliente.create(value)).toThrow(
        DomainValidationException,
      );
    }
  });
});
