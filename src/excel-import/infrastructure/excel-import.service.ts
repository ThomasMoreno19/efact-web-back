import { BadRequestException, Injectable } from '@nestjs/common';
import { ImportarExcelCatalogoUseCase } from '../application/use-cases/importar-excel-catalogo.use-case';
import { ExcelImportMode } from '../application/excel-import-mode';
import type { CatalogImportPlan } from '@/catalogo-admin/application/ports/catalogo-bulk-import.repository';
import type { ClienteImportSet } from '@/cliente/application/ports/cliente-bulk-import.repository';
import { ExcelWorkbookParser } from './excel-workbook.parser';

export const MAX_EXCEL_IMPORT_BYTES = 200 * 1024 * 1024;

@Injectable()
export class ExcelImportService {
  constructor(
    private readonly parser: ExcelWorkbookParser,
    private readonly importCatalog: ImportarExcelCatalogoUseCase,
  ) {}

  async preview(
    empresaId: number,
    file: { buffer: Buffer; size: number; originalname?: string } | undefined,
  ) {
    const buffer = this.validateFile(file);
    await this.importCatalog.ensureImportEnabled(empresaId);
    const plan = await this.parser.parse(buffer);
    return this.importCatalog.preview(empresaId, plan.articulo.rows.length);
  }

  async import(
    empresaId: number,
    file: { buffer: Buffer; size: number; originalname?: string } | undefined,
    mode: ExcelImportMode,
  ) {
    const buffer = this.validateFile(file);
    await this.importCatalog.ensureImportEnabled(empresaId);
    const plan = await this.parser.parse(buffer);
    return this.importCatalog.execute(
      empresaId,
      toCatalogPlan(plan),
      toClienteSet(plan),
      mode,
    );
  }

  async previewAndImport(
    empresaId: number,
    file: { buffer: Buffer; size: number; originalname?: string } | undefined,
    mode: ExcelImportMode,
  ) {
    const buffer = this.validateFile(file);
    await this.importCatalog.ensureImportEnabled(empresaId);
    const plan = await this.parser.parse(buffer);
    return this.importCatalog.execute(
      empresaId,
      toCatalogPlan(plan),
      toClienteSet(plan),
      mode,
      true,
    );
  }

  private validateFile(
    file: { buffer: Buffer; size: number; originalname?: string } | undefined,
  ) {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BadRequestException('Seleccioná un archivo Excel.');
    }
    if (
      file.size > MAX_EXCEL_IMPORT_BYTES ||
      file.buffer.length > MAX_EXCEL_IMPORT_BYTES
    ) {
      throw new BadRequestException(
        'El archivo Excel no puede superar los 200 MB.',
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

function toCatalogPlan(
  plan: Awaited<ReturnType<ExcelWorkbookParser['parse']>>,
): CatalogImportPlan {
  return {
    articulo: plan.articulo,
    proveedor: plan.proveedor,
    rubro: plan.rubro,
    marca: plan.marca,
    ubicacion: plan.ubicacion,
  };
}

function toClienteSet(
  plan: Awaited<ReturnType<ExcelWorkbookParser['parse']>>,
): ClienteImportSet {
  return plan.cliente;
}
