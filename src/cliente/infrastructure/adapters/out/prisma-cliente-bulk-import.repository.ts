import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';
import { currentArgentinaDateAsUtcDate } from '@/shared/infrastructure/current-argentina-date';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import {
  READ_CACHE_GROUPS,
  READ_CACHE_TTL_MS,
  ReadCacheService,
} from '@/shared/infrastructure/cache/read-cache.service';
import { toPrismaImportTransaction } from '@/shared/infrastructure/prisma/prisma-import-unit-of-work';
import type {
  ClienteBulkImportRepository,
  ClienteImportMode,
  ClienteImportRow,
  ClienteImportSourceRow,
} from '../../../application/ports/cliente-bulk-import.repository';

const BATCH_SIZE = 2500;
type PreparedCliente = ClienteImportRow & { passwordHash: string | null };
type SqlValue = string | number | bigint | boolean | Date | null;

@Injectable()
export class PrismaClienteBulkImportRepository implements ClienteBulkImportRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readCache: ReadCacheService,
  ) {}

  countByEmpresa(empresaId: number) {
    return this.readCache.getOrLoad(
      `clientes:${empresaId}:count`,
      READ_CACHE_GROUPS.clientes(empresaId),
      READ_CACHE_TTL_MS,
      () => this.prisma.cliente.count({ where: { idEmpresa: empresaId } }),
    );
  }

  async *iterateCuilDeletionBatches(
    empresaId: number,
    activeCuils: string[],
    explicitCuils: string[],
    mode: ClienteImportMode,
    context: ImportTransactionContext,
  ): AsyncIterable<string[]> {
    const transaction = toPrismaImportTransaction(context);
    if (mode !== 'sincronizar') {
      for (const batch of chunks([...new Set(explicitCuils)], BATCH_SIZE)) {
        if (batch.length > 0) yield batch;
      }
      return;
    }

    const active = new Set(activeCuils);
    let cursor: string | undefined;
    while (true) {
      const cursorCondition =
        cursor === undefined ? Prisma.empty : Prisma.sql`AND cuil > ${cursor}`;
      const existing = await transaction.$queryRaw<
        Array<{ cuil: string }>
      >(Prisma.sql`
        SELECT cuil FROM cliente
        WHERE id_empresa = ${empresaId} ${cursorCondition}
        ORDER BY cuil ASC LIMIT ${BATCH_SIZE}
      `);
      if (existing.length === 0) break;
      cursor = existing[existing.length - 1].cuil;
      const deleted = existing
        .map(({ cuil }) => cuil)
        .filter((cuil) => !active.has(cuil));
      if (deleted.length > 0) {
        yield deleted;
      }
    }
  }

  async upsert(
    empresaId: number,
    rows: ClienteImportSourceRow<PreparedCliente>[],
    context: ImportTransactionContext,
  ) {
    const transaction = toPrismaImportTransaction(context);
    const values: Record<string, SqlValue>[] = rows.map(({ value }) => ({
      id_empresa: empresaId,
      cuil: value.cuil,
      nombre: value.nombre,
      saldo: value.saldo,
      updated_at: currentArgentinaDateAsUtcDate(),
      contrasena: value.passwordHash,
      domicilio: value.domicilio,
      localidad: value.localidad,
      telefonos: value.telefonos,
    }));
    await bulkUpsert(
      transaction,
      values,
      [
        'id_empresa',
        'cuil',
        'nombre',
        'saldo',
        'updated_at',
        'contrasena',
        'domicilio',
        'localidad',
        'telefonos',
      ],
      [
        'nombre',
        'saldo',
        'updated_at',
        'domicilio',
        'localidad',
        'telefonos',
        'contrasena',
      ],
      ['contrasena'],
    );
  }

  async delete(
    empresaId: number,
    cuils: string[],
    context: ImportTransactionContext,
  ) {
    const transaction = toPrismaImportTransaction(context);
    let deleted = 0;
    for (const batch of chunks([...new Set(cuils)], BATCH_SIZE)) {
      if (batch.length === 0) continue;
      deleted += await transaction.$executeRaw(Prisma.sql`
        DELETE FROM cliente
        WHERE id_empresa = ${empresaId}
          AND cuil IN (${Prisma.join(batch.map((cuil) => Prisma.sql`${cuil}`))})
      `);
    }
    return deleted;
  }
}

async function bulkUpsert(
  transaction: Prisma.TransactionClient,
  rows: Record<string, SqlValue>[],
  columns: string[],
  updateColumns: string[],
  coalesceColumns: string[],
) {
  const coalesce = new Set(coalesceColumns);
  for (const batch of chunks(rows, BATCH_SIZE)) {
    if (batch.length === 0) continue;
    const tuples = batch.map(
      (row) =>
        Prisma.sql`(${Prisma.join(columns.map((column) => row[column]))})`,
    );
    const updates = updateColumns.map((column) => {
      const field = Prisma.raw(quoteIdentifier(column));
      return coalesce.has(column)
        ? Prisma.sql`${field} = COALESCE(VALUES(${field}), ${field})`
        : Prisma.sql`${field} = VALUES(${field})`;
    });
    await transaction.$executeRaw(Prisma.sql`
      INSERT INTO cliente (${Prisma.raw(columns.map(quoteIdentifier).join(', '))})
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
