import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { toPrismaImportTransaction } from '@/shared/infrastructure/prisma/prisma-import-unit-of-work';
import { MovimientoImportIdExistenteException } from '../../../application/exceptions/movimiento-import-id-existente.exception';
import type {
  MovimientoBulkImportRepository,
  MovimientoImportMode,
  MovimientoImportRow,
  MovimientoImportSourceRow,
} from '../../../application/ports/movimiento-bulk-import.repository';

const BATCH_SIZE = 2500;
type SqlValue = string | number | bigint | boolean | Date | null;

@Injectable()
export class PrismaMovimientoBulkImportRepository implements MovimientoBulkImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  countByEmpresa(empresaId: number) {
    return this.prisma.movimiento.count({ where: { id_empresa: empresaId } });
  }

  async import(
    empresaId: number,
    rows: MovimientoImportSourceRow<MovimientoImportRow>[],
    activeIds: number[],
    mode: MovimientoImportMode,
    context: ImportTransactionContext,
  ) {
    const transaction = toPrismaImportTransaction(context);
    const movementIds = rows.map(({ value }) => value.idMovimiento);
    await this.ensureIdsBelongToEmpresa(transaction, empresaId, movementIds);

    const values: Record<string, SqlValue>[] = rows.map(({ value }) => ({
      id: value.idMovimiento,
      id_empresa: empresaId,
      id_equipo: value.idEquipo,
      estado: value.estado,
      fecha: value.fecha ? new Date(`${value.fecha}T00:00:00.000Z`) : null,
      observacion: value.observacion,
    }));
    await bulkUpsert(transaction, values);

    let deleted = 0;
    if (mode === 'sincronizar') {
      deleted = await this.deleteMissing(
        transaction,
        empresaId,
        new Set(activeIds),
      );
    }
    return { processed: rows.length, deleted };
  }

  private async ensureIdsBelongToEmpresa(
    transaction: Prisma.TransactionClient,
    empresaId: number,
    ids: number[],
  ) {
    for (const batch of chunks(ids, BATCH_SIZE)) {
      const conflicts = await transaction.movimiento.findMany({
        where: { id: { in: batch }, id_empresa: { not: empresaId } },
        select: { id: true },
      });
      if (conflicts.length > 0) {
        throw new MovimientoImportIdExistenteException();
      }
    }
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
        SELECT id FROM movimiento
        WHERE id_empresa = ${empresaId} ${cursorCondition}
        ORDER BY id ASC LIMIT ${BATCH_SIZE}
      `);
      if (existing.length === 0) break;
      cursor = existing[existing.length - 1].id;
      const missing = existing
        .map(({ id }) => id)
        .filter((id) => !activeIds.has(id));
      for (const batch of chunks(missing, BATCH_SIZE)) {
        if (batch.length === 0) continue;
        deleted += await transaction.$executeRaw(Prisma.sql`
          DELETE FROM movimiento WHERE id_empresa = ${empresaId}
            AND id IN (${Prisma.join(batch.map((id) => Prisma.sql`${id}`))})
        `);
      }
    }
    return deleted;
  }
}

async function bulkUpsert(
  transaction: Prisma.TransactionClient,
  rows: Record<string, SqlValue>[],
) {
  const columns = [
    'id',
    'id_empresa',
    'id_equipo',
    'estado',
    'fecha',
    'observacion',
  ];
  const updateColumns = ['id_equipo', 'estado', 'fecha', 'observacion'];
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
      INSERT INTO movimiento (${Prisma.raw(columns.map(quoteIdentifier).join(', '))})
      VALUES ${Prisma.join(tuples)}
      ON DUPLICATE KEY UPDATE ${Prisma.join(updates)}
    `);
  }
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
