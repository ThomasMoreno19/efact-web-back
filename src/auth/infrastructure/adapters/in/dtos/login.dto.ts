import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contrasena!: string;
}
