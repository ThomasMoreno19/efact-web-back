import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';

const CUIT_CUIL_PREFIXES = new Set([
  '20',
  '23',
  '24',
  '25',
  '26',
  '27',
  '30',
  '33',
  '34',
]);

const CUIT_CUIL_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export class IdentificacionCliente {
  private constructor(private readonly _valor: string) {}

  static create(value: string): IdentificacionCliente {
    const input = value.trim();
    const isDni =
      /^\d{7,8}$/.test(input) || /^\d{1,2}(?:\.\d{3}){2}$/.test(input);
    const isFormattedCuitCuil = /^\d{2}-\d{8}-\d$/.test(input);
    const isUnformattedCuitCuil = /^\d{11}$/.test(input);

    if (!isDni && !isFormattedCuitCuil && !isUnformattedCuitCuil) {
      throw IdentificacionCliente.invalidFormat();
    }

    const normalized = input.replace(/\D/g, '');
    if (
      normalized.length === 11 &&
      !IdentificacionCliente.isValidCuitCuil(normalized)
    ) {
      throw IdentificacionCliente.invalidFormat();
    }

    return new IdentificacionCliente(normalized);
  }

  get valor(): string {
    return this._valor;
  }

  private static isValidCuitCuil(value: string): boolean {
    if (!CUIT_CUIL_PREFIXES.has(value.slice(0, 2))) {
      return false;
    }

    const sum = CUIT_CUIL_WEIGHTS.reduce(
      (total, weight, index) => total + Number(value[index]) * weight,
      0,
    );
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;

    return checkDigit < 10 && Number(value[10]) === checkDigit;
  }

  private static invalidFormat(): DomainValidationException {
    return new DomainValidationException(
      'El DNI, CUIL o CUIT del cliente tiene un formato inválido.',
    );
  }
}
