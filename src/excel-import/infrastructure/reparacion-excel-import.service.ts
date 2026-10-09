import { BadRequestException, Injectable } from '@nestjs/common';
import { ImportarExcelReparacionesUseCase } from '../application/use-cases/importar-excel-reparaciones.use-case';
import { ExcelImportMode } from '../application/excel-import-mode';
import { RepairWorkbookParser } from './reparacion-workbook.parser';

export const MAX_REPAIR_EXCEL_IMPORT_BYTES = 50 * 1024 * 1024;

@Injectable()
export class RepairExcelImportService {
  constructor(
    private readonly parser: RepairWorkbookParser,
    private readonly importRepairs: ImportarExcelReparacionesUseCase,
  ) {}

  async preview(
    empresaId: number,
    file: { buffer: Buffer; size: number; originalname?: string } | undefined,
  ) {
    const buffer = this.validateFile(file);
    await this.importRepairs.ensureImportEnabled(empresaId);
    const plan = await this.parser.parse(buffer);
    return this.importRepairs.preview(empresaId, plan.rows.length);
  }

  async import(
    empresaId: number,
    file: { buffer: Buffer; size: number; originalname?: string } | undefined,
    mode: ExcelImportMode,
  ) {
    const buffer = this.validateFile(file);
    await this.importRepairs.ensureImportEnabled(empresaId);
    const plan = await this.parser.parse(buffer);
    return this.importRepairs.execute(empresaId, plan, mode);
  }

  private validateFile(
    file: { buffer: Buffer; size: number; originalname?: string } | undefined,
  ) {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BadRequestException('Seleccioná un archivo Excel.');
    }
    if (
      file.size > MAX_REPAIR_EXCEL_IMPORT_BYTES ||
      file.buffer.length > MAX_REPAIR_EXCEL_IMPORT_BYTES
    ) {
      throw new BadRequestException(
        'El archivo Excel no puede superar los 50 MB.',
      );
    }
    if (
      file.originalname &&
      !file.originalname.toLowerCase().endsWith('.xlsx')
    ) {
      throw new BadRequestException('El archivo debe tener extensión .xlsx.');
    }
    if (
      file.buffer.length < 4 ||
      file.buffer[0] !== 0x50 ||
      file.buffer[1] !== 0x4b
    ) {
      throw new BadRequestException(
        'El archivo seleccionado no es un Excel .xlsx válido.',
      );
    }
    return file.buffer;
  }
}
