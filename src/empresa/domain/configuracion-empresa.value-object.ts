import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';

export type ConfiguracionEmpresaData = {
  tieneCarrito: boolean;
  habilitarExcel: boolean;
  catalogoHabilitado: boolean;
  saldosHabilitados: boolean;
  reparacionesHabilitadas: boolean;
  imagenesEnArticulos: boolean;
  incluirHorarios: boolean;
  pedidosFueraHorario: boolean;
  incluirCodigoBarra: boolean;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
};

export type ConfiguracionEmpresaInput = Partial<ConfiguracionEmpresaData>;

export class ConfiguracionEmpresa {
  private constructor(
    private readonly _tieneCarrito: boolean,
    private readonly _habilitarExcel: boolean,
    private readonly _catalogoHabilitado: boolean,
    private readonly _saldosHabilitados: boolean,
    private readonly _reparacionesHabilitadas: boolean,
    private readonly _imagenesEnArticulos: boolean,
    private readonly _incluirHorarios: boolean,
    private readonly _pedidosFueraHorario: boolean,
    private readonly _incluirCodigoBarra: boolean,
    private readonly _toleranciaMinDias: number | null,
    private readonly _toleranciaMaxDias: number | null,
  ) {
    ConfiguracionEmpresa.validateTolerancias(
      _toleranciaMinDias,
      _toleranciaMaxDias,
    );
  }

  static create(data: ConfiguracionEmpresaInput): ConfiguracionEmpresa {
    return new ConfiguracionEmpresa(
      data.tieneCarrito ?? true,
      data.habilitarExcel ?? true,
      data.catalogoHabilitado ?? data.tieneCarrito ?? false,
      data.saldosHabilitados ?? false,
      data.reparacionesHabilitadas ?? false,
      data.imagenesEnArticulos ?? true,
      data.incluirHorarios ?? false,
      data.pedidosFueraHorario ?? false,
      data.incluirCodigoBarra ?? false,
      data.toleranciaMinDias ?? null,
      data.toleranciaMaxDias ?? null,
    );
  }

  static rehydrate(data: ConfiguracionEmpresaData): ConfiguracionEmpresa {
    return new ConfiguracionEmpresa(
      data.tieneCarrito,
      data.habilitarExcel,
      data.catalogoHabilitado,
      data.saldosHabilitados,
      data.reparacionesHabilitadas,
      data.imagenesEnArticulos,
      data.incluirHorarios,
      data.pedidosFueraHorario,
      data.incluirCodigoBarra,
      data.toleranciaMinDias,
      data.toleranciaMaxDias,
    );
  }

  update(data: Partial<ConfiguracionEmpresaData>): ConfiguracionEmpresa {
    return ConfiguracionEmpresa.rehydrate({
      tieneCarrito: data.tieneCarrito ?? this._tieneCarrito,
      habilitarExcel: data.habilitarExcel ?? this._habilitarExcel,
      catalogoHabilitado:
        data.catalogoHabilitado ?? this._catalogoHabilitado,
      saldosHabilitados: data.saldosHabilitados ?? this._saldosHabilitados,
      reparacionesHabilitadas:
        data.reparacionesHabilitadas ?? this._reparacionesHabilitadas,
      imagenesEnArticulos:
        data.imagenesEnArticulos ?? this._imagenesEnArticulos,
      incluirHorarios: data.incluirHorarios ?? this._incluirHorarios,
      pedidosFueraHorario:
        data.pedidosFueraHorario ?? this._pedidosFueraHorario,
      incluirCodigoBarra: data.incluirCodigoBarra ?? this._incluirCodigoBarra,
      toleranciaMinDias:
        data.toleranciaMinDias === undefined
          ? this._toleranciaMinDias
          : data.toleranciaMinDias,
      toleranciaMaxDias:
        data.toleranciaMaxDias === undefined
          ? this._toleranciaMaxDias
          : data.toleranciaMaxDias,
    });
  }

  get tieneCarrito(): boolean {
    return this._tieneCarrito;
  }

  get habilitarExcel(): boolean {
    return this._habilitarExcel;
  }

  get catalogoHabilitado(): boolean {
    return this._catalogoHabilitado;
  }

  get saldosHabilitados(): boolean {
    return this._saldosHabilitados;
  }

  get reparacionesHabilitadas(): boolean {
    return this._reparacionesHabilitadas;
  }

  get imagenesEnArticulos(): boolean {
    return this._imagenesEnArticulos;
  }

  get incluirHorarios(): boolean {
    return this._incluirHorarios;
  }

  get pedidosFueraHorario(): boolean {
    return this._pedidosFueraHorario;
  }

  get incluirCodigoBarra(): boolean {
    return this._incluirCodigoBarra;
  }

  get toleranciaMinDias(): number | null {
    return this._toleranciaMinDias;
  }

  get toleranciaMaxDias(): number | null {
    return this._toleranciaMaxDias;
  }

  private static validateTolerancias(
    toleranciaMinDias: number | null,
    toleranciaMaxDias: number | null,
  ): void {
    if (toleranciaMinDias !== null && !Number.isInteger(toleranciaMinDias)) {
      throw new DomainValidationException(
        'La tolerancia mínima debe ser un número entero.',
      );
    }

    if (toleranciaMaxDias !== null && !Number.isInteger(toleranciaMaxDias)) {
      throw new DomainValidationException(
        'La tolerancia máxima debe ser un número entero.',
      );
    }

    if (toleranciaMaxDias !== null && toleranciaMinDias === null) {
      throw new DomainValidationException(
        'La tolerancia máxima requiere una tolerancia mínima.',
      );
    }

    if (
      toleranciaMinDias !== null &&
      toleranciaMaxDias !== null &&
      toleranciaMaxDias <= toleranciaMinDias
    ) {
      throw new DomainValidationException(
        'La tolerancia máxima debe ser mayor que la tolerancia mínima.',
      );
    }
  }
}
