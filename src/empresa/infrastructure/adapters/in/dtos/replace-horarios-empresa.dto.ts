import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class HorarioEmpresaDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana!: number;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  horaApertura!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  horaCierre!: string;
}

export class ReplaceHorariosEmpresaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioEmpresaDto)
  horarios!: HorarioEmpresaDto[];
}
