import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMovimientoDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4_294_967_295)
  idEquipo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  estado?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha?: string | null;

  @IsOptional()
  @IsString()
  observacion?: string | null;
}
