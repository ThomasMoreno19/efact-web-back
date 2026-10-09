import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ConsultarSaldoClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  cuil!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasena?: string;
}
