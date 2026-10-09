import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../../../domain/role.enum';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasena!: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsInt()
  id_empresa?: number | null;
}
