import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS, { type Row, type Worksheet } from 'exceljs';

export interface RepairImportRow {
  idMovimiento: number;
  idEquipo: number;
  nombreEquipo: string | null;
  marca: string | null;
  modelo: string | null;
  nroSerie: string | null;
  cuil: string;
  nombreCliente: string | null;
  password: string | null;
  estado: string | null;
  fecha: string | null;
  observacion: string | null;
}

export interface RepairClientImportRow {
  cuil: string;
  nombre: string | null;
  password: string | null;
}

export interface RepairSourceRow<T> {
  rowNumber: number;
  value: T;
}

export interface RepairImportPlan {
  rows: RepairSourceRow<RepairImportRow>[];
  clientes: RepairSourceRow<RepairClientImportRow>[];
}

interface ExcelImportIssue {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

class RowValidationError extends Error {
  constructor(
    readonly column: string,
    message: string,
  ) {
    super(message);
  }
}

const REQUIRED_HEADERS = [
  'IdMovimiento',
  'IdEquipo',
  'Equipo',
  'Marca',
  'Modelo',
  'Nro Serie o Dominio',
  'Cliente',
  'Estado',
  'Fecha',
  'Observaciones',
  'CUIT',
  'Password',
];

const MAX_REPORTED_ISSUES = 100;

@Injectable()
export class RepairWorkbookParser {
  async parse(buffer: Buffer): Promise<RepairImportPlan> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(
        buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );
    } catch {
      throw new BadRequestException('No se pudo leer el archivo Excel.');
    }

    const worksheet = workbook.worksheets.find(
      (sheet) => normalize(sheet.name) === normalize('Hoja1'),
    );
    if (!worksheet) {
      throw new BadRequestException(
        'El Excel debe incluir una hoja llamada Hoja1.',
      );
    }

    const issues: ExcelImportIssue[] = [];
    const headers = readHeaders(worksheet, issues);
    for (const header of REQUIRED_HEADERS) {
      if (!headers.has(normalize(header))) {
        issues.push({
          sheet: worksheet.name,
          row: 1,
          column: header,
          message: 'Falta la columna requerida.',
        });
      }
    }

    const rows: RepairSourceRow<RepairImportRow>[] = [];
    const seenMovementIds = new Set<number>();
    const seenEquipmentIds = new Set<number>();
    const clients = new Map<string, RepairSourceRow<RepairClientImportRow>>();

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      if (isRowBlank(row)) continue;

      try {
        const idMovimiento = requiredId(row, headers, 'IdMovimiento');
        const idEquipo = requiredId(row, headers, 'IdEquipo');
        if (seenMovementIds.has(idMovimiento)) {
          throw new RowValidationError(
            'IdMovimiento',
            'El identificador del movimiento aparece más de una vez.',
          );
        }
        if (seenEquipmentIds.has(idEquipo)) {
          throw new RowValidationError(
            'IdEquipo',
            'Cada equipo debe tener un único movimiento en el Excel.',
          );
        }
        seenMovementIds.add(idMovimiento);
        seenEquipmentIds.add(idEquipo);

        const cuil = requiredText(row, headers, 'CUIT', 30).replace(
          /[.-]/g,
          '',
        );

        const nombreCliente = optionalText(row, headers, 'Cliente', 150);
        const password = optionalPassword(row, headers);
        const value: RepairImportRow = {
          idMovimiento,
          idEquipo,
          nombreEquipo: optionalText(row, headers, 'Equipo', 150),
          marca: optionalText(row, headers, 'Marca', 150),
          modelo: optionalText(row, headers, 'Modelo', 150),
          nroSerie: optionalText(row, headers, 'Nro Serie o Dominio', 100),
          cuil,
          nombreCliente,
          password,
          estado: optionalText(row, headers, 'Estado', 150),
          fecha: optionalDate(row, headers, 'Fecha'),
          observacion: optionalText(row, headers, 'Observaciones', 65_535),
        };

        rows.push({ rowNumber, value });
        mergeClient(
          clients,
          { rowNumber, value: { cuil, nombre: nombreCliente, password } },
          issues,
          worksheet.name,
        );
      } catch (error) {
        const rowError =
          error instanceof RowValidationError
            ? error
            : new RowValidationError('', 'No se pudo interpretar la fila.');
        issues.push({
          sheet: worksheet.name,
          row: rowNumber,
          column: rowError.column,
          message: rowError.message,
        });
      }
    }

    if (rows.length === 0 && issues.length === 0) {
      issues.push({
        sheet: worksheet.name,
        row: 2,
        column: '',
        message: 'El Excel no contiene registros de reparación.',
      });
    }

    if (issues.length > 0) {
      throw new BadRequestException({
        message: 'El Excel tiene errores de formato o de datos.',
        errors: issues.slice(0, MAX_REPORTED_ISSUES),
        omittedErrors: Math.max(0, issues.length - MAX_REPORTED_ISSUES),
      });
    }

    return { rows, clientes: [...clients.values()] };
  }
}

function readHeaders(worksheet: Worksheet, issues: ExcelImportIssue[]) {
  const headers = new Map<string, number>();
  const row = worksheet.getRow(1);
  for (let column = 1; column <= worksheet.columnCount; column += 1) {
    const header = textValue(row.getCell(column).value);
    if (!header) continue;
    const normalized = normalize(header);
    if (headers.has(normalized)) {
      issues.push({
        sheet: worksheet.name,
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

function mergeClient(
  clients: Map<string, RepairSourceRow<RepairClientImportRow>>,
  incoming: RepairSourceRow<RepairClientImportRow>,
  issues: ExcelImportIssue[],
  sheet: string,
) {
  const existing = clients.get(incoming.value.cuil);
  if (!existing) {
    clients.set(incoming.value.cuil, incoming);
    return;
  }

  if (
    existing.value.nombre &&
    incoming.value.nombre &&
    normalize(existing.value.nombre) !== normalize(incoming.value.nombre)
  ) {
    issues.push({
      sheet,
      row: incoming.rowNumber,
      column: 'Cliente',
      message: 'El mismo CUIT/CUIL tiene nombres distintos en el Excel.',
    });
  } else if (!existing.value.nombre && incoming.value.nombre) {
    existing.value.nombre = incoming.value.nombre;
  }

  if (
    existing.value.password &&
    incoming.value.password &&
    existing.value.password !== incoming.value.password
  ) {
    issues.push({
      sheet,
      row: incoming.rowNumber,
      column: 'Password',
      message: 'El mismo CUIT/CUIL tiene contraseñas distintas en el Excel.',
    });
  } else if (!existing.value.password && incoming.value.password) {
    existing.value.password = incoming.value.password;
  }
}

function requiredId(row: Row, headers: Map<string, number>, header: string) {
  const raw = rawValue(row, headers, header);
  let value: number;
  if (typeof raw === 'number') {
    value = raw;
  } else if (typeof raw === 'string' && /^\d+(?:\.0+)?$/.test(raw.trim())) {
    value = Number(raw.trim());
  } else {
    throw new RowValidationError(header, 'Debe ser un identificador entero.');
  }

  if (!Number.isSafeInteger(value) || value < 0 || value > 4_294_967_295) {
    throw new RowValidationError(
      header,
      'El identificador está fuera del rango permitido.',
    );
  }
  return value;
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
  if (
    value.length > maxLength ||
    (header === 'Observaciones' && Buffer.byteLength(value, 'utf8') > 65_535)
  ) {
    throw new RowValidationError(
      header,
      `El valor supera el máximo permitido de ${maxLength} caracteres.`,
    );
  }
  return value;
}

function optionalPassword(row: Row, headers: Map<string, number>) {
  const raw = rawValue(row, headers, 'Password');
  if (raw === null || raw === undefined) return null;
  const value = primitiveText(raw);
  if (value === null || value.trim().length === 0) return null;
  if (value.length > 255) {
    throw new RowValidationError(
      'Password',
      'La contraseña no puede superar 255 caracteres.',
    );
  }
  return value;
}

function optionalDate(row: Row, headers: Map<string, number>, header: string) {
  const raw = rawValue(row, headers, header);
  if (raw === null || raw === undefined || raw === '') return null;

  let date: Date | null = null;
  if (raw instanceof Date) {
    date = raw;
  } else if (typeof raw === 'number' && Number.isFinite(raw)) {
    date = new Date(Date.UTC(1899, 11, 30) + raw * 86_400_000);
  } else if (typeof raw === 'string') {
    const value = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      date = new Date(`${value}T00:00:00.000Z`);
      if (
        !Number.isFinite(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        date = null;
      }
    } else {
      const localDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
      if (localDate) {
        date = new Date(
          Date.UTC(
            Number(localDate[3]),
            Number(localDate[2]) - 1,
            Number(localDate[1]),
          ),
        );
        if (
          date.getUTCDate() !== Number(localDate[1]) ||
          date.getUTCMonth() !== Number(localDate[2]) - 1 ||
          date.getUTCFullYear() !== Number(localDate[3])
        ) {
          date = null;
        }
      } else {
        const parsed = new Date(value);
        if (Number.isFinite(parsed.getTime())) date = parsed;
      }
    }
  }

  if (!date || !Number.isFinite(date.getTime())) {
    throw new RowValidationError(header, 'Debe ser una fecha válida.');
  }
  return date.toISOString().slice(0, 10);
}

function rawValue(row: Row, headers: Map<string, number>, header: string) {
  const column = headers.get(normalize(header));
  if (column === undefined) return null;
  return unwrapValue(row.getCell(column).value);
}

function textValue(value: unknown): string | null {
  const text = primitiveText(value)?.trim();
  return text ? text : null;
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
    if (primitiveText(row.getCell(column).value)?.trim()) return false;
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
