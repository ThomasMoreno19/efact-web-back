import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9](?:[ -]?\d){7,14}$/)
  @MaxLength(18)
  telefono?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ubicacion?: string | null;

  @IsBoolean()
  tieneCarrito!: boolean;

  @IsOptional()
  @IsBoolean()
  habilitarExcel?: boolean;

  @IsOptional()
  @IsBoolean()
  catalogoHabilitado?: boolean;

  @IsOptional()
  @IsBoolean()
  saldosHabilitados?: boolean;

  @IsOptional()
  @IsBoolean()
  reparacionesHabilitadas?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  logo_url?: string | null;

  @IsOptional()
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

  @IsOptional()
  @IsInt()
  toleranciaMinDias?: number | null;

  @IsOptional()
  @IsInt()
  toleranciaMaxDias?: number | null;
}
