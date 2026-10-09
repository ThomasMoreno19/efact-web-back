import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';
import { ConfiguracionEmpresa } from './configuracion-empresa.value-object';
import type {
  ConfiguracionEmpresaData,
  ConfiguracionEmpresaInput,
} from './configuracion-empresa.value-object';

export class Empresa {
  private constructor(
    private readonly _id: number | null,
    private _nombre: string,
    private _slug: string,
    private _telefono: string | null,
    private _ubicacion: string | null,
    private _logoUrl: string | null,
    private _fechaCreacion: string | null,
    private _configuracion: ConfiguracionEmpresa,
  ) {}

  static create(data: {
    nombre: string;
    slug: string;
    telefono?: string | null;
    ubicacion?: string | null;
    logo_url?: string | null;
    fecha_creacion?: string | null;
    configuracion: ConfiguracionEmpresaInput;
  }): Empresa {
    return new Empresa(
      null,
      Empresa.normalizeNombre(data.nombre),
      Empresa.validateSlug(data.slug),
      data.telefono ?? null,
      data.ubicacion ?? null,
      data.logo_url ?? null,
      data.fecha_creacion ?? null,
      ConfiguracionEmpresa.create(data.configuracion),
    );
  }

  static rehydrate(data: {
    id: number;
    nombre: string;
    slug: string;
    telefono: string | null;
    ubicacion: string | null;
    logo_url: string | null;
    fecha_creacion: string | null;
    configuracion: ConfiguracionEmpresaData;
  }): Empresa {
    return new Empresa(
      data.id,
      data.nombre,
      data.slug,
      data.telefono,
      data.ubicacion,
      data.logo_url,
      data.fecha_creacion,
      ConfiguracionEmpresa.rehydrate(data.configuracion),
    );
  }

  update(data: {
    nombre?: string;
    slug?: string;
    telefono?: string | null;
    ubicacion?: string | null;
    logo_url?: string | null;
    fecha_creacion?: string | null;
    configuracion?: Partial<ConfiguracionEmpresaData>;
  }): void {
    if (data.nombre !== undefined) {
      this._nombre = Empresa.normalizeNombre(data.nombre);
    }
    if (data.slug !== undefined) this._slug = Empresa.validateSlug(data.slug);
    if (data.telefono !== undefined) this._telefono = data.telefono;
    if (data.ubicacion !== undefined) this._ubicacion = data.ubicacion;
    if (data.logo_url !== undefined) this._logoUrl = data.logo_url;
    if (data.fecha_creacion !== undefined)
      this._fechaCreacion = data.fecha_creacion;
    if (data.configuracion !== undefined) {
      this._configuracion = this._configuracion.update(data.configuracion);
    }
  }

  get id(): number | null {
    return this._id;
  }

  get nombre(): string {
    return this._nombre;
  }

  get slug(): string {
    return this._slug;
  }

  get telefono(): string | null {
    return this._telefono;
  }

  get ubicacion(): string | null {
    return this._ubicacion;
  }

  get logo_url(): string | null {
    return this._logoUrl;
  }

  get fecha_creacion(): string | null {
    return this._fechaCreacion;
  }

  get configuracion(): ConfiguracionEmpresa {
    return this._configuracion;
  }

  private static normalizeNombre(nombre: string): string {
    const normalized = nombre.trim();
    if (normalized.length === 0) {
      throw new DomainValidationException(
        'El nombre de la empresa es obligatorio.',
      );
    }
    if (normalized.length > 100) {
      throw new DomainValidationException(
        'El nombre de la empresa no puede superar los 100 caracteres.',
      );
    }
    return normalized;
  }

  private static validateSlug(slug: string): string {
    if (
      slug.length === 0 ||
      slug.length > 100 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      throw new DomainValidationException(
        'El slug debe estar en kebab-case y tener hasta 100 caracteres.',
      );
    }
    return slug;
  }
}
