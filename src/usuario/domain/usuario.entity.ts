import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';
import { Role } from './role.enum';

export class Usuario {
  private constructor(
    private readonly _id: number | null,
    private _nombre: string | null,
    private _passwordHash: string,
    private _role: Role,
    private _idEmpresa: number | null,
    private _refreshTokenHash: string | null,
  ) {}

  static create(data: {
    nombre?: string | null;
    passwordHash: string;
    role?: Role;
    id_empresa?: number | null;
    refreshTokenHash?: string | null;
  }): Usuario {
    const role = data.role ?? Role.ADMIN;
    const idEmpresa = data.id_empresa ?? null;
    Usuario.validateRoleAssociation(role, idEmpresa);
    const nombre = Usuario.normalizeNombre(data.nombre, role);
    Usuario.validatePasswordHash(data.passwordHash);
    return new Usuario(
      null,
      nombre,
      data.passwordHash,
      role,
      idEmpresa,
      Usuario.validateRefreshTokenHash(data.refreshTokenHash ?? null),
    );
  }

  static rehydrate(data: {
    id: number;
    nombre: string | null;
    passwordHash: string;
    role: Role;
    id_empresa: number | null;
    refreshTokenHash?: string | null;
  }): Usuario {
    Usuario.validateRoleAssociation(data.role, data.id_empresa);
    return new Usuario(
      data.id,
      Usuario.normalizeNombre(data.nombre, data.role),
      data.passwordHash,
      data.role,
      data.id_empresa,
      Usuario.validateRefreshTokenHash(data.refreshTokenHash ?? null),
    );
  }

  update(data: {
    nombre?: string;
    passwordHash?: string;
    role?: Role;
    id_empresa?: number | null;
    refreshTokenHash?: string | null;
  }): void {
    const role = data.role ?? this._role;
    const idEmpresa =
      data.id_empresa === undefined ? this._idEmpresa : data.id_empresa;
    Usuario.validateRoleAssociation(role, idEmpresa);
    this._nombre = Usuario.normalizeNombre(
      data.nombre === undefined ? this._nombre : data.nombre,
      role,
    );
    if (data.passwordHash !== undefined) {
      Usuario.validatePasswordHash(data.passwordHash);
      this._passwordHash = data.passwordHash;
    }
    if (data.role !== undefined) this._role = data.role;
    if (data.id_empresa !== undefined) this._idEmpresa = data.id_empresa;
    if (data.refreshTokenHash !== undefined) {
      this._refreshTokenHash = Usuario.validateRefreshTokenHash(
        data.refreshTokenHash,
      );
    }
  }

  get id(): number | null {
    return this._id;
  }

  get nombre(): string | null {
    return this._nombre;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): Role {
    return this._role;
  }

  get id_empresa(): number | null {
    return this._idEmpresa;
  }

  get refreshTokenHash(): string | null {
    return this._refreshTokenHash;
  }

  private static normalizeNombre(
    nombre: string | null | undefined,
    role: Role,
  ): string | null {
    if (role === Role.INTERNO) return null;
    if (typeof nombre !== 'string') {
      throw new DomainValidationException('El nombre del usuario es obligatorio.');
    }
    const normalized = nombre.trim();
    if (normalized.length === 0) {
      throw new DomainValidationException(
        'El nombre del usuario es obligatorio.',
      );
    }
    if (normalized.length > 255) {
      throw new DomainValidationException(
        'El nombre del usuario no puede superar los 255 caracteres.',
      );
    }
    return normalized;
  }

  private static validatePasswordHash(passwordHash: string): void {
    if (passwordHash.trim().length === 0 || passwordHash.length > 255) {
      throw new DomainValidationException(
        'La contraseña del usuario no es válida.',
      );
    }
  }

  private static validateRefreshTokenHash(
    refreshTokenHash: string | null,
  ): string | null {
    if (
      refreshTokenHash !== null &&
      (refreshTokenHash.trim().length === 0 || refreshTokenHash.length > 255)
    ) {
      throw new DomainValidationException(
        'El hash del token de actualización no es válido.',
      );
    }
    return refreshTokenHash;
  }

  private static validateRoleAssociation(
    role: Role,
    idEmpresa: number | null,
  ): void {
    if (role === Role.INTERNO && idEmpresa === null) {
      throw new DomainValidationException(
        'Los usuarios internos deben estar asociados a una empresa.',
      );
    }
  }
}
