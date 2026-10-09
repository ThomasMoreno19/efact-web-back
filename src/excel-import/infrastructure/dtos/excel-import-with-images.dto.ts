import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ExcelImportDto } from './excel-import.dto';

export class ExcelImportWithImagesDto extends ExcelImportDto {
  @IsOptional()
  @IsString()
  @MaxLength(20_000_000)
  imageManifest?: string;
}
