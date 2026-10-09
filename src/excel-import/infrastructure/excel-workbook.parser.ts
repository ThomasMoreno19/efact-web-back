import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS, { type Row, type Worksheet } from 'exceljs';

export interface SourceRow<T> {
  rowNumber: number;
  value: T;
}

export interface ImportSet<T, TKey> {
  rows: SourceRow<T>[];
  deletedKeys: SourceRow<TKey>[];
}

export interface ArticuloImportRow {
  id: bigint;
  codigo_interno: number;
  codigo_barra: string | null;
  id_rubro: number | null;
  id_proveedor: number | null;
  id_marca: number | null;
  id_ubicacion: number | null;
  nombre: string;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  no_procesado: number;
  oferta: boolean;
  codigo_proveedor: string | null;
  tiene_existencia: boolean;
  existencia: number;
  minima_existencia: number | null;
  maxima_existencia: number | null;
  abreviatura: string | null;
  unidad_medida: string | null;
}

export interface LookupImportRow {
  id: number;
  nombre: string;
  abreviatura: string | null;
}

export interface ClienteImportRow {
  cuil: string;
  nombre: string | null;
  domicilio: string | null;
  localidad: string | null;
  telefonos: string | null;
  saldo: number | null;
  password: string | null;
}

export interface UbicacionImportRow {
  id: number;
  descripcion: string;
}

export interface ExcelImportPlan {
  articulo: ImportSet<ArticuloImportRow, bigint>;
  proveedor: ImportSet<LookupImportRow, number>;
  rubro: ImportSet<LookupImportRow, number>;
  marca: ImportSet<LookupImportRow, number>;
  cliente: ImportSet<ClienteImportRow, string>;
  ubicacion: ImportSet<UbicacionImportRow, number>;
}

export interface ExcelImportIssue {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

interface ParsedRow<TKey, TValue> {
  key: TKey;
  value: TValue | null;
}

class RowValidationError extends Error {
  constructor(
    readonly column: string,
    message: string,
  ) {
    super(message);
  }
}

const REQUIRED_HEADERS: Record<string, string[]> = {
  Articulo: [
    'Código',
    'Descripción',
    'Código Proveedor',
    'ID Proveedor',
    'ID Rubro',
    'ID Marca',
    'Precio 1',
    'Precio 2',
    'Precio 3',
    'Existencia',
    'Actualiza Existencia',
    'NO Disponible',
    'ID Ubicacion',
    'Oferta',
    'Baja',
  ],
  Proveedor: ['Descripción', 'Baja'],
  Rubro: ['Descripción', 'Baja'],
  Marca: ['Descripción', 'Baja'],
  Cliente: [
    'Descripción',
    'Domicilio',
    'Localidad',
    'Teléfonos',
    'Saldo',
    'Password',
  ],
  Ubicacion: ['Descripción'],
};

const MAX_REPORTED_ISSUES = 100;

@Injectable()
export class ExcelWorkbookParser {
  async parse(buffer: Buffer): Promise<ExcelImportPlan> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(
        buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );
    } catch {
      throw new BadRequestException('No se pudo leer el archivo Excel.');
    }

    const issues: ExcelImportIssue[] = [];
    const worksheets = new Map<string, Worksheet>();
    for (const worksheet of workbook.worksheets) {
      const key = normalize(worksheet.name);
      if (worksheets.has(key)) {
        issues.push({
          sheet: worksheet.name,
          row: 1,
          column: '',
          message: 'Hay más de una hoja con el mismo nombre normalizado.',
        });
      } else {
        worksheets.set(key, worksheet);
      }
    }

    const plan: ExcelImportPlan = {
      articulo: this.parseSheet(
        'Articulo',
        worksheets,
        ['ID'],
        (row, headers, _rowNumber, deleted) => {
          const id = requiredBigInt(row, headers, 'ID');
          if (deleted) return { key: id, value: null };

          const codigoInterno = requiredInteger(row, headers, 'Código');
          const nombre = requiredText(row, headers, 'Descripción', 100);
          const actualizaExistencia = booleanValue(
            row,
            headers,
            'Actualiza Existencia',
          );
          const noDisponible = booleanValue(row, headers, 'NO Disponible');
          const oferta = booleanValue(row, headers, 'Oferta');

          return {
            key: id,
            value: {
              id,
              codigo_interno: codigoInterno,
              codigo_barra: optionalText(row, headers, 'Código Barra', 20),
              id_rubro: optionalInteger(row, headers, 'ID Rubro'),
              id_proveedor: optionalInteger(row, headers, 'ID Proveedor'),
              id_marca: optionalInteger(row, headers, 'ID Marca'),
              id_ubicacion: optionalInteger(row, headers, 'ID Ubicacion'),
              nombre,
              precio1: optionalRoundedInteger(
                row,
                headers,
                'Precio 1',
                -9_999_999_999,
                9_999_999_999,
              ),
              precio2: optionalRoundedInteger(
                row,
                headers,
                'Precio 2',
                -9_999_999_999,
                9_999_999_999,
              ),
              precio3: optionalRoundedInteger(
                row,
                headers,
                'Precio 3',
                -9_999_999_999,
                9_999_999_999,
              ),
              no_procesado: noDisponible ? 1 : 0,
              oferta,
              codigo_proveedor: optionalText(
                row,
                headers,
                'Código Proveedor',
                200,
              ),
              tiene_existencia: actualizaExistencia,
              existencia: optionalInteger(row, headers, 'Existencia') ?? 0,
              minima_existencia: optionalInteger(row, headers, 'Mínimo'),
              maxima_existencia: optionalInteger(row, headers, 'Máximo'),
              abreviatura: optionalText(row, headers, 'Abreviatura', 40),
              unidad_medida: optionalText(row, headers, 'Unidad Medida', 100),
            },
          };
        },
        issues,
      ),
      proveedor: this.parseSheet(
        'Proveedor',
        worksheets,
        ['ID'],
        (row, headers, _rowNumber, deleted) => {
          const id = requiredInteger(row, headers, 'ID');
          if (deleted) return { key: id, value: null };
          return {
            key: id,
            value: {
              id,
              nombre: requiredText(row, headers, 'Descripción', 255),
              abreviatura: optionalText(row, headers, 'Abreviatura', 30),
            },
          };
        },
        issues,
      ),
      rubro: this.parseSheet(
        'Rubro',
        worksheets,
        ['ID'],
        (row, headers, _rowNumber, deleted) => {
          const id = requiredInteger(row, headers, 'ID');
          if (deleted) return { key: id, value: null };
          return {
            key: id,
            value: {
              id,
              nombre: requiredText(row, headers, 'Descripción', 80),
              abreviatura: optionalText(row, headers, 'Abreviatura', 30),
            },
          };
        },
        issues,
      ),
      marca: this.parseSheet(
        'Marca',
        worksheets,
        ['ID'],
        (row, headers, _rowNumber, deleted) => {
          const id = requiredInteger(row, headers, 'ID');
          if (deleted) return { key: id, value: null };
          return {
            key: id,
            value: {
              id,
              nombre: requiredText(row, headers, 'Descripción', 255),
              abreviatura: optionalText(row, headers, 'Abreviatura', 30),
            },
          };
        },
        issues,
      ),
      cliente: this.parseSheet(
        'Cliente',
        worksheets,
        ['CUIT/CODIGO'],
        (row, headers, _rowNumber, deleted) => {
          const cuil = requiredText(row, headers, 'CUIT/CODIGO', 30).replace(
            /[.-]/g,
            '',
          );
          if (deleted) return { key: cuil, value: null };

          const rawPassword = optionalPassword(row, headers);

          return {
            key: cuil,
            value: {
              cuil,
              nombre: optionalText(row, headers, 'Descripción', 150),
              domicilio: optionalText(row, headers, 'Domicilio', 255),
              localidad: optionalText(row, headers, 'Localidad', 150),
              telefonos: optionalText(row, headers, 'Teléfonos', 255),
              saldo: optionalRoundedInteger(
                row,
                headers,
                'Saldo',
                -2_147_483_648,
                2_147_483_647,
              ),
              password: rawPassword,
            },
          };
        },
        issues,
      ),
      ubicacion: this.parseSheet(
        'Ubicacion',
        worksheets,
        ['ID'],
        (row, headers, _rowNumber, deleted) => {
          const id = requiredInteger(row, headers, 'ID');
          if (deleted) return { key: id, value: null };
          return {
            key: id,
            value: {
              id,
              descripcion: requiredText(row, headers, 'Descripción', 50),
            },
          };
        },
        issues,
      ),
    };

    this.validateArticleReferences(plan, issues);
    if (issues.length > 0) {
      const reportedIssues = issues.slice(0, MAX_REPORTED_ISSUES);
      throw new BadRequestException({
        message: 'El Excel tiene errores de formato o de datos.',
        errors: reportedIssues,
        omittedErrors: Math.max(0, issues.length - reportedIssues.length),
      });
    }

    return plan;
  }

  private parseSheet<TKey extends string | number | bigint, TValue>(
    sheetName: string,
    worksheets: Map<string, Worksheet>,
    keyHeaders: string[],
    parse: (
      row: Row,
      headers: Map<string, number>,
      rowNumber: number,
      deleted: boolean,
    ) => ParsedRow<TKey, TValue>,
    issues: ExcelImportIssue[],
  ): ImportSet<TValue, TKey> {
    const worksheet = worksheets.get(normalize(sheetName));
    if (!worksheet) {
      issues.push({
        sheet: sheetName,
        row: 1,
        column: '',
        message: 'Falta la hoja requerida.',
      });
      return { rows: [], deletedKeys: [] };
    }

    const headers = readHeaders(worksheet, sheetName, issues);
    for (const header of REQUIRED_HEADERS[sheetName] ?? []) {
      if (!headers.has(normalize(header))) {
        issues.push({
          sheet: sheetName,
          row: 1,
          column: header,
          message: 'Falta la columna requerida.',
        });
      }
    }
    for (const header of keyHeaders) {
      if (!headers.has(normalize(header))) {
        issues.push({
          sheet: sheetName,
          row: 1,
          column: header,
          message: 'Falta la columna que identifica el registro.',
        });
      }
    }

    const rows: SourceRow<TValue>[] = [];
    const deletedKeys: SourceRow<TKey>[] = [];
    const seenKeys = new Set<string>();
    const hasBaja = headers.has(normalize('Baja'));

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      if (isRowBlank(row)) continue;

      try {
        const deleted = hasBaja ? booleanValue(row, headers, 'Baja') : false;
        const parsed = parse(row, headers, rowNumber, deleted);
        const stringKey = stringifyKey(parsed.key);
        if (seenKeys.has(stringKey)) {
          throw new RowValidationError(
            keyHeaders[0] ?? 'ID',
            'La clave aparece más de una vez en la hoja.',
          );
        }
        seenKeys.add(stringKey);

        if (deleted) {
          deletedKeys.push({ rowNumber, value: parsed.key });
        } else if (parsed.value !== null) {
          rows.push({ rowNumber, value: parsed.value });
        }
      } catch (error) {
        const rowError =
          error instanceof RowValidationError
            ? error
            : new RowValidationError('', 'No se pudo interpretar la fila.');
        issues.push({
          sheet: sheetName,
          row: rowNumber,
          column: rowError.column,
          message: rowError.message,
        });
      }
    }

    return { rows, deletedKeys };
  }

  private validateArticleReferences(
    plan: ExcelImportPlan,
    issues: ExcelImportIssue[],
  ) {
    const proveedores = new Set(
      plan.proveedor.rows.map(({ value }) => value.id),
    );
    const rubros = new Set(plan.rubro.rows.map(({ value }) => value.id));
    const marcas = new Set(plan.marca.rows.map(({ value }) => value.id));
    const ubicaciones = new Set(
      plan.ubicacion.rows.map(({ value }) => value.id),
    );

    for (const article of plan.articulo.rows) {
      const references: Array<{
        id: number | null;
        values: Set<number>;
        column: string;
        label: string;
      }> = [
        {
          id: article.value.id_proveedor,
          values: proveedores,
          column: 'ID Proveedor',
          label: 'proveedor',
        },
        {
          id: article.value.id_rubro,
          values: rubros,
          column: 'ID Rubro',
          label: 'rubro',
        },
        {
          id: article.value.id_marca,
          values: marcas,
          column: 'ID Marca',
          label: 'marca',
        },
        {
          id: article.value.id_ubicacion,
          values: ubicaciones,
          column: 'ID Ubicacion',
          label: 'ubicación',
        },
      ];

      for (const reference of references) {
        if (reference.id !== null && !reference.values.has(reference.id)) {
          issues.push({
            sheet: 'Articulo',
            row: article.rowNumber,
            column: reference.column,
            message: `No existe el ${reference.label} indicado en la hoja correspondiente.`,
          });
        }
      }
    }
  }
}

function readHeaders(
  worksheet: Worksheet,
  sheetName: string,
  issues: ExcelImportIssue[],
) {
  const headers = new Map<string, number>();
  const row = worksheet.getRow(1);
  for (let column = 1; column <= worksheet.columnCount; column += 1) {
    const header = textValue(row.getCell(column).value);
    if (!header) continue;
    const normalized = normalize(header);
    if (headers.has(normalized)) {
      issues.push({
        sheet: sheetName,
        row: 1,
        column: header,
        message: 'La columna aparece más de una vez.',
      });
      continue;
    }
    headers.set(normalized, column);
  }
  return headers;
}

function rawValue(row: Row, headers: Map<string, number>, header: string) {
  const column = headers.get(normalize(header));
  if (column === undefined) return null;
  return unwrapValue(row.getCell(column).value);
}

function requiredText(
  row: Row,
  headers: Map<string, number>,
  header: string,
  maxLength: number,
) {
  const value = textValue(rawValue(row, headers, header));
  if (value === null) {
    throw new RowValidationError(header, 'El valor es obligatorio.');
  }
  if (value.length > maxLength) {
    throw new RowValidationError(
      header,
      `El valor no puede superar ${maxLength} caracteres.`,
    );
  }
  return value;
}

function optionalText(
  row: Row,
  headers: Map<string, number>,
  header: string,
  maxLength: number,
) {
  const value = textValue(rawValue(row, headers, header));
  if (value === null) return null;
  if (value.length > maxLength) {
    throw new RowValidationError(
      header,
      `El valor no puede superar ${maxLength} caracteres.`,
    );
  }
  return value;
}

function optionalPassword(row: Row, headers: Map<string, number>) {
  const raw = rawValue(row, headers, 'Password');
  if (raw === null || raw === undefined) return null;
  const value = primitiveText(raw);
  if (value === null) return null;
  if (value.trim().length === 0) return null;
  if (value.length > 255) {
    throw new RowValidationError(
      'Password',
      'La contraseña no puede superar 255 caracteres.',
    );
  }
  return value;
}

function requiredInteger(
  row: Row,
  headers: Map<string, number>,
  header: string,
) {
  const value = integerValue(rawValue(row, headers, header), header);
  if (value === null) {
    throw new RowValidationError(header, 'El valor entero es obligatorio.');
  }
  return value;
}

function optionalInteger(
  row: Row,
  headers: Map<string, number>,
  header: string,
) {
  return integerValue(rawValue(row, headers, header), header);
}

function optionalRoundedInteger(
  row: Row,
  headers: Map<string, number>,
  header: string,
  minimum: number,
  maximum: number,
) {
  const raw = rawValue(row, headers, header);
  if (raw === null || raw === undefined || raw === '') return null;

  const numericValue =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && raw.trim() !== ''
        ? Number(raw.trim())
        : Number.NaN;
  if (!Number.isFinite(numericValue)) {
    throw new RowValidationError(header, 'Debe ser un número válido.');
  }

  const rounded =
    numericValue < 0
      ? -Math.round(Math.abs(numericValue))
      : Math.round(numericValue);
  if (rounded < minimum || rounded > maximum) {
    throw new RowValidationError(header, 'El número está fuera de rango.');
  }
  return rounded;
}

function requiredBigInt(
  row: Row,
  headers: Map<string, number>,
  header: string,
) {
  const raw = rawValue(row, headers, header);
  if (raw === null || raw === '') {
    throw new RowValidationError(header, 'El identificador es obligatorio.');
  }

  let value: bigint;
  if (typeof raw === 'bigint') {
    value = raw;
  } else if (typeof raw === 'number') {
    if (!Number.isSafeInteger(raw)) {
      throw new RowValidationError(
        header,
        'El identificador numérico excede la precisión segura de Excel.',
      );
    }
    value = BigInt(raw);
  } else if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    value = BigInt(raw.trim());
  } else {
    throw new RowValidationError(header, 'Debe ser un número entero válido.');
  }

  if (value < 0n || value > 9_223_372_036_854_775_807n) {
    throw new RowValidationError(
      header,
      'El identificador está fuera de rango.',
    );
  }
  return value;
}

function integerValue(value: unknown, header: string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  let number: number;
  if (typeof value === 'number') {
    number = value;
  } else if (
    typeof value === 'string' &&
    /^-?\d+(?:\.0+)?$/.test(value.trim())
  ) {
    number = Number(value.trim());
  } else {
    throw new RowValidationError(header, 'Debe ser un número entero válido.');
  }

  if (
    !Number.isSafeInteger(number) ||
    number < -2_147_483_648 ||
    number > 2_147_483_647
  ) {
    throw new RowValidationError(
      header,
      'El número entero está fuera de rango.',
    );
  }
  return number;
}

function booleanValue(row: Row, headers: Map<string, number>, header: string) {
  const raw = rawValue(row, headers, header);
  if (raw === null || raw === undefined || raw === '') return false;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number' && (raw === 0 || raw === 1)) return raw === 1;

  const value = primitiveText(raw);
  if (value === null) {
    throw new RowValidationError(header, 'El valor booleano no es válido.');
  }
  const normalized = normalize(value);
  if (['true', 'verdadero', '1', 'si'].includes(normalized)) return true;
  if (['false', 'falso', '0', 'no'].includes(normalized)) return false;
  throw new RowValidationError(
    header,
    'Usá Verdadero/Falso o un valor booleano de Excel.',
  );
}

function textValue(value: unknown): string | null {
  const text = primitiveText(value)?.trim();
  if (text === undefined || text === null) return null;
  return text.length === 0 ? null : text;
}

function primitiveText(value: unknown): string | null {
  const unwrapped = unwrapValue(value);
  if (typeof unwrapped === 'string') return unwrapped;
  if (
    typeof unwrapped === 'number' ||
    typeof unwrapped === 'bigint' ||
    typeof unwrapped === 'boolean'
  ) {
    return String(unwrapped);
  }
  return null;
}

function unwrapValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || value instanceof Date) {
    return value;
  }
  const cellValue = value as Record<string, unknown>;
  if ('result' in cellValue) return cellValue.result ?? null;
  if ('text' in cellValue && typeof cellValue.text === 'string') {
    return cellValue.text;
  }
  if (Array.isArray(cellValue.richText)) {
    return cellValue.richText
      .map((part) => {
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as { text: unknown }).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .join('');
  }
  return value;
}

function isRowBlank(row: Row) {
  for (let column = 1; column <= row.cellCount; column += 1) {
    const value = unwrapValue(row.getCell(column).value);
    if (primitiveText(value)?.trim()) return false;
  }
  return true;
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function stringifyKey(value: string | number | bigint) {
  return String(value);
}
