import { IsEnum } from 'class-validator';
import { ExcelImportMode } from '../../application/excel-import-mode';

export class ExcelImportDto {
  @IsEnum(ExcelImportMode)
  mode!: ExcelImportMode;
}
