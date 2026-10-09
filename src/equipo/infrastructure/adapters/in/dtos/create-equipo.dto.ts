import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEquipoDto {
  @IsInt()
  @Min(0)
  @Max(4_294_967_295)
  id!: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  marca?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  modelo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreEquipo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  createdAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nroSerie?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cuilCliente?: string | null;
}
