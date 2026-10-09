import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCatalogoRegistroImagenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000)
  data!: string;
}
