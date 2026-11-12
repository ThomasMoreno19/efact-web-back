import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateExternoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  contrasena!: string;
}
