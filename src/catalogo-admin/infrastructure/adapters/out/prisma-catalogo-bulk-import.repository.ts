import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ImportTransactionContext } from '@/shared/application/ports/import-unit-of-work';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import {
  READ_CACHE_GROUPS,
  READ_CACHE_TTL_MS,
  ReadCacheService,
} from '@/shared/infrastructure/cache/read-cache.service';
import { toPrismaImportTransaction } from '@/shared/infrastructure/prisma/prisma-import-unit-of-work';
import { CatalogoImportReferenciadoException } from '../../../application/exceptions/catalogo-import-referenciado.exception';
import type {
  CatalogArticleImportRow,
  CatalogBulkImportRepository,
  CatalogDeleteCounts,
  CatalogImportMode,
  CatalogImportPlan,
  CatalogImportSourceRow,
  CatalogLookupImportRow,
} from '../../../application/ports/catalogo-bulk-import.repository';

const BATCH_SIZE = 2500;

type IdTable = 'articulo' | 'proveedor' | 'rubro' | 'marca' | 'ubicacion';
type TenantLookupTable = Exclude<IdTable, 'articulo'>;
type ArticleLookupField =
  'id_proveedor' | 'id_rubro' | 'id_marca' | 'id_ubicacion';
type SqlValue = string | number | bigint | boolean | Date | null;
type SqlRow = Record<string, SqlValue>;

@Injectable()
export class PrismaCatalogoBulkImportRepository implements CatalogBulkImportRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readCache: ReadCacheService,
  ) {}

  countArticles(empresaId: number) {
    return this.readCache.getOrLoad(
      `catalogo:${empresaId}:articulos:count`,
      READ_CACHE_GROUPS.catalogo(empresaId, 'articulos'),
      READ_CACHE_TTL_MS,
      () => this.prisma.articulo.count({ where: { id_empresa: empresaId } }),
    );
  }

  async import(
    empresaId: number,
    plan: CatalogImportPlan,
    mode: CatalogImportMode,
    context: ImportTransactionContext,
  ): Promise<CatalogDeleteCounts> {
    const transaction = toPrismaImportTransaction(context);
    try {
      await this.upsertLookups(
        transaction,
        'proveedor',
        empresaId,
        plan.proveedor.rows,
      );
      await this.upsertLookups(
        transaction,
        'rubro',
        empresaId,
        plan.rubro.rows,
      );
      await this.upsertLookups(
        transaction,
        'marca',
        empresaId,
        plan.marca.rows,
      );
      await this.upsertLocations(transaction, empresaId, plan.ubicacion.rows);
      await this.upsertArticles(transaction, empresaId, plan.articulo.rows);

      const articulos = await this.deleteByMode(
        transaction,
        'articulo',
        empresaId,
        mode,
        plan.articulo.rows.map(({ value }) => value.id),
        plan.articulo.deletedKeys.map(({ value }) => value),
      );
      const proveedores = await this.deleteByMode(
        transaction,
        'proveedor',
        empresaId,
        mode,
        plan.proveedor.rows.map(({ value }) => value.id),
        plan.proveedor.deletedKeys.map(({ value }) => value),
      );
      const rubros = await this.deleteByMode(
        transaction,
        'rubro',
        empresaId,
        mode,
        plan.rubro.rows.map(({ value }) => value.id),
        plan.rubro.deletedKeys.map(({ value }) => value),
      );
      const marcas = await this.deleteByMode(
        transaction,
        'marca',
        empresaId,
        mode,
        plan.marca.rows.map(({ value }) => value.id),
        plan.marca.deletedKeys.map(({ value }) => value),
      );
      const ubicaciones = await this.deleteByMode(
        transaction,
        'ubicacion',
        empresaId,
        mode,
        plan.ubicacion.rows.map(({ value }) => value.id),
        plan.ubicacion.deletedKeys.map(({ value }) => value),
      );

      return { articulos, proveedores, rubros, marcas, ubicaciones };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new CatalogoImportReferenciadoException(
          'No se pudo dar de baja un rubro, proveedor, marca o ubicación que todavía está asociado a un artículo. Revisá las filas marcadas con Baja.',
        );
      }
      throw error;
    }
  }

  private async upsertLookups(
    transaction: Prisma.TransactionClient,
    table: 'proveedor' | 'rubro' | 'marca',
    empresaId: number,
    rows: CatalogImportSourceRow<CatalogLookupImportRow>[],
  ) {
    const values: SqlRow[] = rows.map(({ value }) => ({
      id: value.id,
      nombre: value.nombre,
      abreviatura: value.abreviatura,
      id_empresa: empresaId,
      aparece_en_csv: true,
      logo_url: null,
    }));
    const columns = [
      'id',
      'nombre',
      'abreviatura',
      'id_empresa',
      'aparece_en_csv',
      'logo_url',
    ];
    await bulkUpsert(transaction, table, columns, values, [
      'nombre',
      'abreviatura',
    ]);
  }

  private async upsertLocations(
    transaction: Prisma.TransactionClient,
    empresaId: number,
    rows: CatalogImportPlan['ubicacion']['rows'],
  ) {
    const values: SqlRow[] = rows.map(({ value }) => ({
      id: value.id,
      id_empresa: empresaId,
      descripcion: value.descripcion,
    }));
    await bulkUpsert(
      transaction,
      'ubicacion',
      ['id', 'id_empresa', 'descripcion'],
      values,
      ['descripcion'],
    );
  }

  private async upsertArticles(
    transaction: Prisma.TransactionClient,
    empresaId: number,
    rows: CatalogImportSourceRow<CatalogArticleImportRow>[],
  ) {
    const values: SqlRow[] = rows.map(({ value }) => ({
      id: value.id,
      codigo_interno: value.codigo_interno,
      codigo_barra: value.codigo_barra,
      id_rubro: value.id_rubro,
      id_proveedor: value.id_proveedor,
      id_marca: value.id_marca,
      id_ubicacion: value.id_ubicacion,
      id_empresa: empresaId,
      nombre: value.nombre,
      precio1: value.precio1,
      precio2: value.precio2,
      precio3: value.precio3,
      no_procesado: value.no_procesado,
      oferta: value.oferta,
      aparece_en_csv: true,
      logo_url: null,
      video_url: null,
      codigo_proveedor: value.codigo_proveedor,
      tiene_existencia: value.tiene_existencia,
      existencia: value.existencia,
      minima_existencia: value.minima_existencia,
      maxima_existencia: value.maxima_existencia,
      abreviatura: value.abreviatura,
      unidad_medida: value.unidad_medida,
    }));

    await bulkUpsert(
      transaction,
      'articulo',
      [
        'id',
        'codigo_interno',
        'codigo_barra',
        'id_rubro',
        'id_proveedor',
        'id_marca',
        'id_ubicacion',
        'id_empresa',
        'nombre',
        'precio1',
        'precio2',
        'precio3',
        'no_procesado',
        'oferta',
        'aparece_en_csv',
        'logo_url',
        'video_url',
        'codigo_proveedor',
        'tiene_existencia',
        'existencia',
        'minima_existencia',
        'maxima_existencia',
        'abreviatura',
        'unidad_medida',
      ],
      values,
      [
        'codigo_interno',
        'codigo_barra',
        'id_rubro',
        'id_proveedor',
        'id_marca',
        'id_ubicacion',
        'nombre',
        'precio1',
        'precio2',
        'precio3',
        'no_procesado',
        'oferta',
        'codigo_proveedor',
        'tiene_existencia',
        'existencia',
        'minima_existencia',
        'maxima_existencia',
        'abreviatura',
        'unidad_medida',
      ],
    );
  }

  private async deleteByMode(
    transaction: Prisma.TransactionClient,
    table: IdTable,
    empresaId: number,
    mode: CatalogImportMode,
    activeKeys: Array<number | bigint>,
    deletedKeys: Array<number | bigint>,
  ) {
    if (mode === 'sincronizar') {
      return this.deleteMissing(
        transaction,
        table,
        empresaId,
        new Set(activeKeys.map(String)),
      );
    }
    if (table !== 'articulo' && deletedKeys.length > 0) {
      await this.ensureLookupRowsAreUnused(
        transaction,
        table,
        empresaId,
        deletedKeys as number[],
      );
    }
    return this.deleteIds(transaction, table, empresaId, deletedKeys);
  }

  private async ensureLookupRowsAreUnused(
    transaction: Prisma.TransactionClient,
    table: TenantLookupTable,
    empresaId: number,
    ids: number[],
  ) {
    const fields: Record<TenantLookupTable, ArticleLookupField> = {
      proveedor: 'id_proveedor',
      rubro: 'id_rubro',
      marca: 'id_marca',
      ubicacion: 'id_ubicacion',
    };
    const labels: Record<TenantLookupTable, string> = {
      proveedor: 'proveedor',
      rubro: 'rubro',
      marca: 'marca',
      ubicacion: 'ubicación',
    };
    for (const batch of chunks(ids, BATCH_SIZE)) {
      const where = {
        id_empresa: empresaId,
        [fields[table]]: { in: batch },
      } as Prisma.ArticuloWhereInput;
      const count = await transaction.articulo.count({ where });
      if (count > 0) {
        throw new CatalogoImportReferenciadoException(
          `No se puede dar de baja el ${labels[table]} porque todavía está asociado a ${count} artículo(s).`,
        );
      }
    }
  }

  private async deleteMissing(
    transaction: Prisma.TransactionClient,
    table: IdTable,
    empresaId: number,
    activeKeys: Set<string>,
  ) {
    let cursor: number | bigint | undefined;
    let deleted = 0;
    const tableName = Prisma.raw(quoteIdentifier(table));
    while (true) {
      const cursorCondition =
        cursor === undefined ? Prisma.empty : Prisma.sql`AND id > ${cursor}`;
      const existing = await transaction.$queryRaw<
        Array<{ id: number | bigint }>
      >(Prisma.sql`
        SELECT id FROM ${tableName}
        WHERE id_empresa = ${empresaId} ${cursorCondition}
        ORDER BY id ASC LIMIT ${BATCH_SIZE}
      `);
      if (existing.length === 0) break;
      cursor = existing[existing.length - 1].id;
      const missing = existing
        .map(({ id }) => id)
        .filter((id) => !activeKeys.has(String(id)));
      deleted += await this.deleteIds(transaction, table, empresaId, missing);
    }
    return deleted;
  }

  private async deleteIds(
    transaction: Prisma.TransactionClient,
    table: IdTable,
    empresaId: number,
    ids: Array<number | bigint>,
  ) {
    let deleted = 0;
    for (const batch of chunks(ids, BATCH_SIZE)) {
      if (batch.length === 0) continue;
      deleted += await transaction.$executeRaw(Prisma.sql`
        DELETE FROM ${Prisma.raw(quoteIdentifier(table))}
        WHERE id_empresa = ${empresaId}
          AND id IN (${Prisma.join(batch.map((id) => Prisma.sql`${id}`))})
      `);
    }
    return deleted;
  }
}

async function bulkUpsert(
  transaction: Prisma.TransactionClient,
  table: IdTable,
  columns: string[],
  rows: SqlRow[],
  updateColumns: string[],
) {
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
      INSERT INTO ${Prisma.raw(quoteIdentifier(table))}
        (${Prisma.raw(columns.map(quoteIdentifier).join(', '))})
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
