import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ConsultarReparacionesPublicasDto {
  @IsIn(['cuil', 'serie'])
  tipo!: 'cuil' | 'serie';

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(100)
  valor!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasena?: string;
}
