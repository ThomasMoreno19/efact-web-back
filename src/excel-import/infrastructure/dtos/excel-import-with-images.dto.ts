import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ExcelCatalogImportMode } from '../../application/excel-import-mode';

export class ExcelImportWithImagesDto {
  @IsEnum(ExcelCatalogImportMode)
  mode!: ExcelCatalogImportMode;

  @IsOptional()
  @IsString()
  @MaxLength(20_000_000)
  imageManifest?: string;
}
