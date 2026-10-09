import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateCatalogoRegistroDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  abreviatura?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  logo_url?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(-2_147_483_648)
  @Max(2_147_483_647)
  codigo_interno?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo_barra?: string | null;

  @IsOptional()
  @IsInt()
  @Min(-9_999_999_999)
  @Max(9_999_999_999)
  precio1?: number | null;

  @IsOptional()
  @IsInt()
  @Min(-9_999_999_999)
  @Max(9_999_999_999)
  precio2?: number | null;

  @IsOptional()
  @IsInt()
  @Min(-9_999_999_999)
  @Max(9_999_999_999)
  precio3?: number | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(-2_147_483_648)
  @Max(2_147_483_647)
  existencia?: number;

  @IsOptional()
  @IsInt()
  @Min(-2_147_483_648)
  @Max(2_147_483_647)
  minima_existencia?: number | null;

  @IsOptional()
  @IsInt()
  @Min(-2_147_483_648)
  @Max(2_147_483_647)
  maxima_existencia?: number | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  tiene_existencia?: boolean;

  @ValidateIf((_object, value) => value !== undefined)
  @IsIn([0, 1])
  no_procesado?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  oferta?: boolean;
}
