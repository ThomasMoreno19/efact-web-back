import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  cuil!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string | null;

  @IsOptional()
  @IsInt()
  @Min(-2_147_483_648)
  @Max(2_147_483_647)
  saldo?: number | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasena?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  domicilio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  localidad?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  telefonos?: string | null;
}
