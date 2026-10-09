import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';
import { IdentificacionCliente } from './identificacion-cliente.value-object';

export class Cliente {
  private constructor(
    private readonly _idEmpresa: number,
    private readonly _cuil: IdentificacionCliente,
    private _nombre: string | null,
    private _saldo: number | null,
    private _updatedAt: string | null,
    private _passwordHash: string | null,
    private _domicilio: string | null,
    private _localidad: string | null,
    private _telefonos: string | null,
  ) {}

  static create(data: {
    idEmpresa: number;
    cuil: string;
    nombre?: string | null;
    saldo?: number | null;
    passwordHash?: string | null;
    domicilio?: string | null;
    localidad?: string | null;
    telefonos?: string | null;
  }): Cliente {
    return new Cliente(
      data.idEmpresa,
      IdentificacionCliente.create(data.cuil),
      data.nombre ?? null,
      Cliente.validateSaldo(data.saldo ?? null),
      null,
      Cliente.validatePasswordHash(data.passwordHash ?? null),
      data.domicilio ?? null,
      data.localidad ?? null,
      data.telefonos ?? null,
    );
  }

  static rehydrate(data: {
    idEmpresa: number;
    cuil: string;
    nombre: string | null;
    saldo: number | null;
    updatedAt: string | null;
    passwordHash: string | null;
    domicilio: string | null;
    localidad: string | null;
    telefonos: string | null;
  }): Cliente {
    return new Cliente(
      data.idEmpresa,
      IdentificacionCliente.create(data.cuil),
      data.nombre,
      Cliente.validateSaldo(data.saldo),
      data.updatedAt,
      Cliente.validatePasswordHash(data.passwordHash),
      data.domicilio,
      data.localidad,
      data.telefonos,
    );
  }

  update(data: {
    nombre?: string | null;
    saldo?: number | null;
    passwordHash?: string | null;
    domicilio?: string | null;
    localidad?: string | null;
    telefonos?: string | null;
  }): void {
    if (data.nombre !== undefined) this._nombre = data.nombre;
    if (data.saldo !== undefined) {
      this._saldo = Cliente.validateSaldo(data.saldo);
    }
    if (data.passwordHash !== undefined) {
      this._passwordHash = Cliente.validatePasswordHash(data.passwordHash);
    }
    if (data.domicilio !== undefined) this._domicilio = data.domicilio;
    if (data.localidad !== undefined) this._localidad = data.localidad;
    if (data.telefonos !== undefined) this._telefonos = data.telefonos;
  }

  get idEmpresa(): number {
    return this._idEmpresa;
  }

  get cuil(): IdentificacionCliente {
    return this._cuil;
  }

  get nombre(): string | null {
    return this._nombre;
  }

  get saldo(): number | null {
    return this._saldo;
  }

  get updatedAt(): string | null {
    return this._updatedAt;
  }

  get passwordHash(): string | null {
    return this._passwordHash;
  }

  get domicilio(): string | null {
    return this._domicilio;
  }

  get localidad(): string | null {
    return this._localidad;
  }

  get telefonos(): string | null {
    return this._telefonos;
  }

  private static validateSaldo(saldo: number | null): number | null {
    if (
      saldo !== null &&
      (!Number.isInteger(saldo) ||
        saldo < -2_147_483_648 ||
        saldo > 2_147_483_647)
    ) {
      throw new DomainValidationException(
        'El saldo debe ser un número entero dentro del rango permitido.',
      );
    }
    return saldo;
  }

  private static validatePasswordHash(
    passwordHash: string | null,
  ): string | null {
    if (
      passwordHash !== null &&
      (passwordHash.trim().length === 0 || passwordHash.length > 255)
    ) {
      throw new DomainValidationException(
        'La contraseña del cliente no es válida.',
      );
    }
    return passwordHash;
  }
}
