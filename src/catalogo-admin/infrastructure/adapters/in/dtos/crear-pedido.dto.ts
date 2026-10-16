import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CrearDetallePedidoDto {
  @IsString()
  @Matches(/^\d+$/)
  @MaxLength(19)
  idArticulo!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  cantidad!: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  observacion?: string | null;
}

export class CrearPedidoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(65535)
  observacion?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CrearDetallePedidoDto)
  detallePedido!: CrearDetallePedidoDto[];
}
