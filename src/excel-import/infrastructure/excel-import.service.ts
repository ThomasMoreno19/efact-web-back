import { BadRequestException, Injectable } from '@nestjs/common';
import { ImportarExcelCatalogoUseCase } from '../application/use-cases/importar-excel-catalogo.use-case';
import {
  ExcelCatalogImportMode,
  ExcelImportMode,
} from '../application/excel-import-mode';
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
    mode: ExcelCatalogImportMode,
  ) {
    const buffer = this.validateFile(file);
    await this.importCatalog.ensureImportEnabled(empresaId);
    const plan = await this.parser.parse(buffer);
    const result = await this.importCatalog.execute(
      empresaId,
      toCatalogPlan(plan, mode),
      toClienteSet(plan, mode),
      toCatalogMode(mode),
    );
    return { ...result, mode };
  }

  async previewAndImport(
    empresaId: number,
    file: { buffer: Buffer; size: number; originalname?: string } | undefined,
    mode: ExcelCatalogImportMode,
  ) {
    const buffer = this.validateFile(file);
    await this.importCatalog.ensureImportEnabled(empresaId);
    const plan = await this.parser.parse(buffer);
    const result = await this.importCatalog.execute(
      empresaId,
      toCatalogPlan(plan, mode),
      toClienteSet(plan, mode),
      toCatalogMode(mode),
      mode !== ExcelCatalogImportMode.RUBRO &&
        mode !== ExcelCatalogImportMode.MARCA &&
        mode !== ExcelCatalogImportMode.PROVEEDOR &&
        mode !== ExcelCatalogImportMode.UBICACION &&
        mode !== ExcelCatalogImportMode.CLIENTE,
    );
    return { ...result, mode };
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
  mode: ExcelCatalogImportMode,
): CatalogImportPlan {
  const all = selectsAll(mode);
  return {
    articulo:
      all || mode === ExcelCatalogImportMode.ARTICULO
        ? plan.articulo
        : { rows: [], deletedKeys: [] },
    proveedor:
      all || mode === ExcelCatalogImportMode.PROVEEDOR
        ? plan.proveedor
        : { rows: [], deletedKeys: [] },
    rubro:
      all || mode === ExcelCatalogImportMode.RUBRO
        ? plan.rubro
        : { rows: [], deletedKeys: [] },
    marca:
      all || mode === ExcelCatalogImportMode.MARCA
        ? plan.marca
        : { rows: [], deletedKeys: [] },
    ubicacion:
      all || mode === ExcelCatalogImportMode.UBICACION
        ? plan.ubicacion
        : { rows: [], deletedKeys: [] },
  };
}

function toClienteSet(
  plan: Awaited<ReturnType<ExcelWorkbookParser['parse']>>,
  mode: ExcelCatalogImportMode,
): ClienteImportSet {
  return selectsAll(mode) || mode === ExcelCatalogImportMode.CLIENTE
    ? plan.cliente
    : { rows: [], deletedKeys: [] };
}

function selectsAll(mode: ExcelCatalogImportMode) {
  return (
    mode === ExcelCatalogImportMode.ACTUALIZAR ||
    mode === ExcelCatalogImportMode.SINCRONIZAR ||
    mode === ExcelCatalogImportMode.SINCRONIZAR_LEGACY ||
    mode === ExcelCatalogImportMode.TODOS
  );
}

function toCatalogMode(mode: ExcelCatalogImportMode): ExcelImportMode {
  const isSynchronization =
    mode === ExcelCatalogImportMode.SINCRONIZAR ||
    mode === ExcelCatalogImportMode.SINCRONIZAR_LEGACY;
  return isSynchronization
    ? ExcelImportMode.SINCRONIZAR
    : ExcelImportMode.ACTUALIZAR;
}
