import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertAdminEmpresaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(72)
  contrasena?: string;
}
