import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../../../domain/role.enum';

export class UpdateUsuarioDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasena?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(Role)
  role?: Role;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsInt()
  id_empresa?: number | null;
}
