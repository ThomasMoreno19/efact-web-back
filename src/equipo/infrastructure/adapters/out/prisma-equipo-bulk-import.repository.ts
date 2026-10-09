import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';
import { toPrismaImportTransaction } from '@/shared/infrastructure/prisma/prisma-import-unit-of-work';
import type {
  EquipoBulkImportRepository,
  EquipoImportRow,
  EquipoImportSourceRow,
} from '../../../application/ports/equipo-bulk-import.repository';

const BATCH_SIZE = 2500;
type SqlValue = string | number | bigint | boolean | Date | null;

@Injectable()
export class PrismaEquipoBulkImportRepository implements EquipoBulkImportRepository {
  async upsert(
    empresaId: number,
    rows: EquipoImportSourceRow<EquipoImportRow>[],
    context: ImportTransactionContext,
  ) {
    const transaction = toPrismaImportTransaction(context);
    const values: Record<string, SqlValue>[] = rows.map(({ value }) => ({
      id: value.idEquipo,
      id_empresa: empresaId,
      marca: value.marca,
      modelo: value.modelo,
      nombre_equipo: value.nombreEquipo,
      nro_serie: value.nroSerie,
      cuil: value.cuil,
    }));
    await bulkUpsert(transaction, values, [
      'id',
      'id_empresa',
      'marca',
      'modelo',
      'nombre_equipo',
      'nro_serie',
      'cuil',
    ]);

    return rows.length;
  }

  synchronize(
    empresaId: number,
    activeIds: number[],
    context: ImportTransactionContext,
  ) {
    return this.deleteMissing(
      toPrismaImportTransaction(context),
      empresaId,
      new Set(activeIds),
    );
  }

  async deleteForCustomers(
    empresaId: number,
    cuils: string[],
    context: ImportTransactionContext,
  ) {
    const transaction = toPrismaImportTransaction(context);
    let deleted = 0;
    for (const batch of chunks([...new Set(cuils)], BATCH_SIZE)) {
      if (batch.length === 0) continue;
      deleted += await transaction.$executeRaw(Prisma.sql`
        DELETE FROM equipo
        WHERE id_empresa = ${empresaId}
          AND cuil IN (${Prisma.join(batch.map((cuil) => Prisma.sql`${cuil}`))})
      `);
    }
    return deleted;
  }

  private async deleteMissing(
    transaction: Prisma.TransactionClient,
    empresaId: number,
    activeIds: Set<number>,
  ) {
    let cursor: number | undefined;
    let deleted = 0;
    while (true) {
      const cursorCondition =
        cursor === undefined ? Prisma.empty : Prisma.sql`AND id > ${cursor}`;
      const existing = await transaction.$queryRaw<
        Array<{ id: number }>
      >(Prisma.sql`
        SELECT id FROM equipo
        WHERE id_empresa = ${empresaId} ${cursorCondition}
        ORDER BY id ASC LIMIT ${BATCH_SIZE}
      `);
      if (existing.length === 0) break;
      cursor = existing[existing.length - 1].id;
      const missing = existing
        .map(({ id }) => id)
        .filter((id) => !activeIds.has(id));
      deleted += await deleteIds(transaction, empresaId, missing);
    }
    return deleted;
  }
}

async function bulkUpsert(
  transaction: Prisma.TransactionClient,
  rows: Record<string, SqlValue>[],
  columns: string[],
) {
  const updateColumns = [
    'marca',
    'modelo',
    'nombre_equipo',
    'nro_serie',
    'cuil',
  ];
  for (const batch of chunks(rows, BATCH_SIZE)) {
    if (batch.length === 0) continue;
    const tuples = batch.map(
      (row) =>
        Prisma.sql`(${Prisma.join(columns.map((column) => row[column]))})`,
    );
    const updates = updateColumns.map((column) => {
      const field = Prisma.raw(quoteIdentifier(column));
      return Prisma.sql`${field} = VALUES(${field})`;
    });
    await transaction.$executeRaw(Prisma.sql`
      INSERT INTO equipo (${Prisma.raw(columns.map(quoteIdentifier).join(', '))})
      VALUES ${Prisma.join(tuples)}
      ON DUPLICATE KEY UPDATE ${Prisma.join(updates)}
    `);
  }
}

async function deleteIds(
  transaction: Prisma.TransactionClient,
  empresaId: number,
  ids: number[],
) {
  let deleted = 0;
  for (const batch of chunks(ids, BATCH_SIZE)) {
    if (batch.length === 0) continue;
    deleted += await transaction.$executeRaw(Prisma.sql`
      DELETE FROM equipo WHERE id_empresa = ${empresaId}
        AND id IN (${Prisma.join(batch.map((id) => Prisma.sql`${id}`))})
    `);
  }
  return deleted;
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function quoteIdentifier(value: string) {
  return `\`${value.replace(/`/g, '``')}\``;
}
