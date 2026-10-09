import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEquipoDto {
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
