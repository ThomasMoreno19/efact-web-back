import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateEmpresaDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsString()
  @Matches(/^\+[1-9](?:[ -]?\d){7,14}$/)
  @MaxLength(18)
  telefono?: string | null;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsString()
  @MaxLength(50)
  ubicacion?: string | null;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  tieneCarrito?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  habilitarExcel?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  catalogoHabilitado?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  saldosHabilitados?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  reparacionesHabilitadas?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  mostrarNavegacionPaginas?: boolean;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsString()
  @MaxLength(255)
  logo_url?: string | null;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsDateString()
  fecha_creacion?: string | null;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  imagenesEnArticulos?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  incluirHorarios?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  pedidosFueraHorario?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  incluirCodigoBarra?: boolean;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsInt()
  toleranciaMinDias?: number | null;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsInt()
  toleranciaMaxDias?: number | null;
}
