import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateAdminCredentialsByEmpresaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasenaActual?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(72)
  contrasenaNueva?: string;
}
