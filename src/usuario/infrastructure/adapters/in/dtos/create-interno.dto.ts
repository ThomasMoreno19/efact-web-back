import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateInternoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasena!: string;
}
