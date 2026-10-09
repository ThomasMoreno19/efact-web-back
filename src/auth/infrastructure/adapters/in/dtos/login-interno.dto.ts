import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class LoginInternoDto {
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  idEmpresa!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasena!: string;
}
