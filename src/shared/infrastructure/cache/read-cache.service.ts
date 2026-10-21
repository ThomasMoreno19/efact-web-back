import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

export const READ_CACHE_TTL_MS = 30 * 60_000;

export type CatalogCacheTable =
  'articulos' | 'marcas' | 'proveedores' | 'rubros' | 'ubicaciones';

export const READ_CACHE_GROUPS = {
  empresas: 'empresas:list',
  empresaSlugs: 'empresas:slug-index',
  empresa: (empresaId: number) => `empresa:${empresaId}`,
  clientes: (empresaId: number) => `clientes:${empresaId}`,
  equipos: (empresaId: number) => `equipos:${empresaId}`,
  movimientos: (empresaId: number) => `movimientos:${empresaId}`,
  catalogo: (empresaId: number, tabla: CatalogCacheTable) =>
    `catalogo:${empresaId}:${tabla}`,
  horarios: (empresaId: number) => `horarios:${empresaId}`,
};

interface PendingEntry {
  group: string;
  promise: Promise<unknown>;
}

interface StoredEntry {
  format: number;
  expiresAt: number;
  value: unknown;
}

@Injectable()
export class ReadCacheService {
  private readonly logger = new Logger(ReadCacheService.name);
  private readonly cacheRoot: string;
  private readonly pending = new Map<string, PendingEntry>();
  private readonly localRevisions = new Map<string, number>();
  private readonly disabledGroups = new Set<string>();
  private warnedStorageFailure = false;

  constructor(config: ConfigService) {
    this.cacheRoot = resolve(
      config.get<string>('READ_CACHE_DIR')?.trim() ||
        join(process.cwd(), '.efact-read-cache'),
      'v1',
      'groups',
    );
  }

  async getOrLoad<T>(
    key: string,
    group: string,
    ttlMs: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const localRevision = this.getLocalRevision(group);
    const diskRevision = await this.readGroupRevision(group);
    const groupHash = hash(group);
    const keyHash = hash(key);
    const pendingKey = `${groupHash}:${diskRevision}:${keyHash}`;

    if (!this.disabledGroups.has(group)) {
      const cached = await this.readEntry<T>(
        this.getEntryPath(groupHash, diskRevision, keyHash),
      );
      if (cached !== undefined) return cached;

      const pending = this.pending.get(pendingKey);
      if (pending?.group === group) return pending.promise as Promise<T>;
    }

    const promise = Promise.resolve()
      .then(loader)
      .then(async (value) => {
        if (
          !this.disabledGroups.has(group) &&
          this.getLocalRevision(group) === localRevision &&
          (await this.readGroupRevision(group)) === diskRevision
        ) {
          await this.writeEntry(
            this.getEntryPath(groupHash, diskRevision, keyHash),
            groupHash,
            value,
            ttlMs,
            group,
          );
        }
        return value;
      })
      .finally(() => {
        if (this.pending.get(pendingKey)?.promise === promise) {
          this.pending.delete(pendingKey);
        }
      });

    if (!this.disabledGroups.has(group)) {
      this.pending.set(pendingKey, { group, promise });
    }
    return promise;
  }

  async invalidateGroup(group: string): Promise<void> {
    this.localRevisions.set(group, this.getLocalRevision(group) + 1);
    for (const [key, entry] of this.pending) {
      if (entry.group === group) this.pending.delete(key);
    }

    if (this.disabledGroups.has(group)) return;

    const groupHash = hash(group);
    const groupDirectory = this.getGroupDirectory(groupHash);
    const revision = randomUUID();
    try {
      await this.writeTextAtomically(
        join(groupDirectory, 'revision'),
        revision,
      );
      await this.pruneOldRevisions(
        groupDirectory,
        this.getVersionDirectory(groupHash, revision),
      );
    } catch {
      this.disabledGroups.add(group);
      this.warnStorageFailure();
    }
  }

  invalidateCompanies(): Promise<void> {
    return Promise.all([
      this.invalidateGroup(READ_CACHE_GROUPS.empresas),
      this.invalidateGroup(READ_CACHE_GROUPS.empresaSlugs),
    ]).then(() => undefined);
  }

  async invalidateCompany(empresaId: number): Promise<void> {
    await Promise.all([
      this.invalidateGroup(READ_CACHE_GROUPS.empresa(empresaId)),
      this.invalidateCompanies(),
    ]);
  }

  async invalidateCompanyData(empresaId: number): Promise<void> {
    await Promise.all([
      this.invalidateGroup(READ_CACHE_GROUPS.clientes(empresaId)),
      this.invalidateGroup(READ_CACHE_GROUPS.equipos(empresaId)),
      this.invalidateGroup(READ_CACHE_GROUPS.movimientos(empresaId)),
      this.invalidateAllCatalog(empresaId),
      this.invalidateHorarios(empresaId),
    ]);
  }

  async invalidateCatalogImportData(
    empresaId: number,
    catalogTables: CatalogCacheTable[],
    includesCustomers: boolean,
  ): Promise<void> {
    const invalidations: Promise<void>[] = [
      this.invalidateCatalogTables(empresaId, catalogTables),
    ];
    if (includesCustomers) {
      invalidations.push(
        this.invalidateGroup(READ_CACHE_GROUPS.clientes(empresaId)),
        this.invalidateGroup(READ_CACHE_GROUPS.equipos(empresaId)),
        this.invalidateGroup(READ_CACHE_GROUPS.movimientos(empresaId)),
      );
    }
    await Promise.all(invalidations);
  }

  async invalidateRepairImportData(empresaId: number): Promise<void> {
    await Promise.all([
      this.invalidateGroup(READ_CACHE_GROUPS.clientes(empresaId)),
      this.invalidateGroup(READ_CACHE_GROUPS.equipos(empresaId)),
      this.invalidateGroup(READ_CACHE_GROUPS.movimientos(empresaId)),
    ]);
  }

  async invalidateCustomers(empresaId: number): Promise<void> {
    await Promise.all([
      this.invalidateGroup(READ_CACHE_GROUPS.clientes(empresaId)),
      this.invalidateMovements(empresaId),
    ]);
  }

  async invalidateEquipment(empresaId: number): Promise<void> {
    await Promise.all([
      this.invalidateGroup(READ_CACHE_GROUPS.equipos(empresaId)),
      this.invalidateMovements(empresaId),
    ]);
  }

  invalidateMovements(empresaId: number): Promise<void> {
    return this.invalidateGroup(READ_CACHE_GROUPS.movimientos(empresaId));
  }

  invalidateCatalog(
    empresaId: number,
    tabla: CatalogCacheTable,
    invalidateArticleViews = true,
  ): Promise<void> {
    const groups = [READ_CACHE_GROUPS.catalogo(empresaId, tabla)];
    if (tabla !== 'articulos' && invalidateArticleViews) {
      groups.push(READ_CACHE_GROUPS.catalogo(empresaId, 'articulos'));
    }
    return Promise.all(groups.map((group) => this.invalidateGroup(group))).then(
      () => undefined,
    );
  }

  async invalidateCatalogTables(
    empresaId: number,
    tables: CatalogCacheTable[],
  ): Promise<void> {
    const affectedTables = new Set(tables);
    if (tables.some((table) => table !== 'articulos')) {
      affectedTables.add('articulos');
    }
    await Promise.all(
      [...affectedTables].map((table) =>
        this.invalidateGroup(READ_CACHE_GROUPS.catalogo(empresaId, table)),
      ),
    );
  }

  async invalidateAllCatalog(empresaId: number): Promise<void> {
    const tables: CatalogCacheTable[] = [
      'articulos',
      'marcas',
      'proveedores',
      'rubros',
      'ubicaciones',
    ];
    await this.invalidateCatalogTables(empresaId, tables);
  }

  invalidateHorarios(empresaId: number): Promise<void> {
    return this.invalidateGroup(READ_CACHE_GROUPS.horarios(empresaId));
  }

  private getLocalRevision(group: string): number {
    return this.localRevisions.get(group) ?? 0;
  }

  private async readGroupRevision(group: string): Promise<string> {
    if (this.disabledGroups.has(group)) return 'disabled';
    try {
      const revision = await readFile(
        join(this.getGroupDirectory(hash(group)), 'revision'),
        'utf8',
      );
      return revision.trim() || 'initial';
    } catch (error) {
      if (isFileNotFound(error)) return 'initial';
      this.disabledGroups.add(group);
      this.warnStorageFailure();
      return 'disabled';
    }
  }

  private async readEntry<T>(path: string): Promise<T | undefined> {
    try {
      const content = await readFile(path, 'utf8');
      const parsed: unknown = JSON.parse(content);
      if (
        !isRecord(parsed) ||
        parsed.format !== 1 ||
        typeof parsed.expiresAt !== 'number' ||
        parsed.expiresAt <= Date.now()
      ) {
        await rm(path, { force: true });
        return undefined;
      }
      return decodeValue(parsed.value) as T;
    } catch (error) {
      if (!isFileNotFound(error)) {
        await rm(path, { force: true }).catch(() => undefined);
        this.warnStorageFailure();
      }
      return undefined;
    }
  }

  private async writeEntry<T>(
    path: string,
    groupHash: string,
    value: T,
    ttlMs: number,
    group: string,
  ): Promise<void> {
    const entry: StoredEntry = {
      format: 1,
      expiresAt: Date.now() + ttlMs,
      value: encodeValue(value),
    };
    try {
      await this.writeJsonAtomically(path, entry);
      await this.pruneVersionDirectory(dirname(path));
      const currentRevision = await this.readGroupRevision(group);
      await this.pruneOldRevisions(
        this.getGroupDirectory(groupHash),
        this.getVersionDirectory(groupHash, currentRevision),
      );
    } catch {
      this.disabledGroups.add(group);
      this.warnStorageFailure();
    }
  }

  private async writeJsonAtomically(
    path: string,
    value: unknown,
  ): Promise<void> {
    await this.writeTextAtomically(path, JSON.stringify(value));
  }

  private async writeTextAtomically(
    path: string,
    content: string,
  ): Promise<void> {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const temporaryPath = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, content, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      await rename(temporaryPath, path);
    } finally {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
    }
  }

  private async pruneVersionDirectory(directory: string): Promise<void> {
    let names: string[];
    try {
      names = await readdir(directory);
    } catch (error) {
      if (isFileNotFound(error)) return;
      throw error;
    }

    for (const name of names) {
      if (!name.endsWith('.json')) continue;
      const path = join(directory, name);
      try {
        const content = await readFile(path, 'utf8');
        const parsed: unknown = JSON.parse(content);
        if (
          !isRecord(parsed) ||
          typeof parsed.expiresAt !== 'number' ||
          parsed.expiresAt <= Date.now()
        ) {
          await rm(path, { force: true });
          continue;
        }
      } catch {
        await rm(path, { force: true }).catch(() => undefined);
      }
    }
  }

  private async pruneOldRevisions(
    groupDirectory: string,
    currentVersionDirectory: string,
  ): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await readdir(groupDirectory, { withFileTypes: true });
    } catch (error) {
      if (isFileNotFound(error)) return;
      throw error;
    }
    const currentDirectoryName = basename(currentVersionDirectory);
    await Promise.all(
      entries
        .filter(
          (entry) => entry.isDirectory() && entry.name !== currentDirectoryName,
        )
        .map((entry) =>
          rm(join(groupDirectory, entry.name), {
            recursive: true,
            force: true,
          }),
        ),
    );
  }

  private getGroupDirectory(groupHash: string): string {
    return join(this.cacheRoot, groupHash);
  }

  private getVersionDirectory(groupHash: string, revision: string): string {
    return join(this.getGroupDirectory(groupHash), hash(revision));
  }

  private getEntryPath(
    groupHash: string,
    revision: string,
    keyHash: string,
  ): string {
    return join(
      this.getVersionDirectory(groupHash, revision),
      `${keyHash}.json`,
    );
  }

  private warnStorageFailure(): void {
    if (this.warnedStorageFailure) return;
    this.warnedStorageFailure = true;
    this.logger.warn(
      'Filesystem cache unavailable; falling back to the database.',
    );
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function encodeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return { __readCacheType: 'date', value: value.toISOString() };
  }
  if (typeof value === 'bigint') {
    return { __readCacheType: 'bigint', value: value.toString() };
  }
  if (Array.isArray(value)) return value.map(encodeValue);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, encodeValue(child)]),
    );
  }
  return value;
}

function decodeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decodeValue);
  if (!isRecord(value)) return value;
  if (value.__readCacheType === 'date' && typeof value.value === 'string') {
    return new Date(value.value);
  }
  if (value.__readCacheType === 'bigint' && typeof value.value === 'string') {
    return BigInt(value.value);
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, decodeValue(child)]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFileNotFound(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
