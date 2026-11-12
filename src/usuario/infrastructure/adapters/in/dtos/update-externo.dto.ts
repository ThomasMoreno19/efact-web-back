import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateExternoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  contrasena?: string;
}
