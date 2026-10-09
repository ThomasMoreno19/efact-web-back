import type {
  ClienteBulkImportRepository,
  ClienteImportMode,
  ClienteImportSet,
} from '../ports/cliente-bulk-import.repository';
import { IdentificacionCliente } from '../../domain/identificacion-cliente.value-object';
import { Cliente } from '../../domain/cliente.entity';
import {
  ClienteImportValidationException,
  type ClienteImportIssue,
} from '../exceptions/cliente-import-validation.exception';
import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';

export class ImportarClientesMasivoUseCase {
  constructor(
    private readonly repository: ClienteBulkImportRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  countByEmpresa(empresaId: number) {
    return this.repository.countByEmpresa(empresaId);
  }

  async upsert(
    empresaId: number,
    set: ClienteImportSet,
    transaction: ImportTransactionContext,
    sheet = 'Cliente',
  ) {
    const rows = await this.prepareRows(empresaId, set, sheet);
    await this.repository.upsert(empresaId, rows, transaction);
    return rows.length;
  }

  delete(
    empresaId: number,
    cuils: string[],
    transaction: ImportTransactionContext,
  ) {
    return this.repository.delete(empresaId, cuils, transaction);
  }

  async *deletionBatches(
    empresaId: number,
    set: ClienteImportSet,
    mode: ClienteImportMode,
    transaction: ImportTransactionContext,
    sheet = 'Cliente',
  ) {
    const issues: ClienteImportIssue[] = [];
    const activeCuils = set.rows.map(({ rowNumber, value }) =>
      this.tryNormalizeCuil(value.cuil, rowNumber, sheet, issues),
    );
    const explicitCuils = set.deletedKeys.map(({ rowNumber, value }) =>
      this.tryNormalizeCuil(value, rowNumber, sheet, issues),
    );
    if (issues.length > 0) {
      throw new ClienteImportValidationException(issues.slice(0, 100));
    }
    yield* this.repository.iterateCuilDeletionBatches(
      empresaId,
      activeCuils as string[],
      explicitCuils as string[],
      mode,
      transaction,
    );
  }

  private async prepareRows(
    empresaId: number,
    set: ClienteImportSet,
    sheet: string,
  ) {
    const prepared: Array<{
      rowNumber: number;
      value: ClienteImportSet['rows'][number]['value'] & {
        passwordHash: string | null;
      };
    }> = [];

    for (let start = 0; start < set.rows.length; start += 8) {
      const batch = set.rows.slice(start, start + 8);
      const hashed = await Promise.all(
        batch.map(async ({ rowNumber, value }) => {
          const cuil = this.normalizeCuil(value.cuil, rowNumber, sheet);
          if (
            value.password !== null &&
            Buffer.byteLength(value.password, 'utf8') > 72
          ) {
            throw new ClienteImportValidationException([
              {
                sheet,
                row: rowNumber,
                column: 'Password',
                message: 'La contraseña no puede superar 72 bytes en UTF-8.',
              },
            ]);
          }
          const passwordHash = value.password
            ? await this.passwordHasher.hash(value.password)
            : null;
          Cliente.create({
            idEmpresa: empresaId,
            cuil,
            nombre: value.nombre,
            saldo: value.saldo,
            passwordHash,
            domicilio: value.domicilio,
            localidad: value.localidad,
            telefonos: value.telefonos,
          });
          return {
            rowNumber,
            value: { ...value, cuil, passwordHash },
          };
        }),
      );
      prepared.push(...hashed);
    }
    return prepared;
  }

  private normalizeCuil(value: string, row: number, sheet = 'Cliente') {
    try {
      return IdentificacionCliente.create(value).valor;
    } catch {
      throw new ClienteImportValidationException([
        {
          sheet,
          row,
          column: sheet === 'Hoja1' ? 'CUIT' : 'CUIT/CODIGO',
          message: 'Debe ser un DNI, CUIL o CUIT válido.',
        },
      ]);
    }
  }

  private tryNormalizeCuil(
    value: string,
    row: number,
    sheet: string,
    issues: ClienteImportIssue[],
  ) {
    try {
      return IdentificacionCliente.create(value).valor;
    } catch {
      issues.push({
        sheet,
        row,
        column: sheet === 'Hoja1' ? 'CUIT' : 'CUIT/CODIGO',
        message: 'Debe ser un DNI, CUIL o CUIT válido.',
      });
      return null;
    }
  }
}
