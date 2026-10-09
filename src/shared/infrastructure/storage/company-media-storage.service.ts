import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, rm } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';

export const COMPANY_MEDIA_COLLECTIONS = [
  'articulos',
  'rubros',
  'marcas',
  'proveedores',
] as const;
export type CompanyMediaCollection = (typeof COMPANY_MEDIA_COLLECTIONS)[number];

@Injectable()
export class CompanyMediaStorageService {
  constructor(private readonly config: ConfigService) {}

  getCompanyDirectory(empresaId: number) {
    this.validateId(empresaId, 'empresa');
    return join(this.getStorageRoot(), String(empresaId));
  }

  getCompanyAssetDirectory(
    empresaId: number,
    collection: CompanyMediaCollection,
    resourceId: number | bigint,
  ) {
    if (!COMPANY_MEDIA_COLLECTIONS.includes(collection)) {
      throw new BadRequestException('El tipo de recurso no es válido.');
    }
    if (typeof resourceId === 'bigint') {
      if (resourceId < 1n) {
        throw new BadRequestException(
          `El identificador de ${collection} no es válido.`,
        );
      }
    } else {
      this.validateId(resourceId, collection);
    }
    return join(
      this.getCompanyDirectory(empresaId),
      collection,
      String(resourceId),
    );
  }

  getCompanyAssetFilePath(
    empresaId: number,
    collection: CompanyMediaCollection,
    resourceId: number | bigint,
    filename: string,
  ) {
    this.validateFilename(filename);
    const directory = this.getCompanyAssetDirectory(
      empresaId,
      collection,
      resourceId,
    );
    const filePath = resolve(directory, filename);
    if (!filePath.startsWith(`${directory}${sep}`)) {
      throw new BadRequestException('El nombre del archivo no es válido.');
    }
    return filePath;
  }

  getCompanyHashedImageDirectory(empresaId: number) {
    return join(this.getCompanyDirectory(empresaId), 'hash');
  }

  getCompanyHashedImageFilePath(empresaId: number, sha256: string) {
    if (!/^[a-f0-9]{64}$/.test(sha256)) {
      throw new BadRequestException('El hash de imagen no es válido.');
    }
    const directory = this.getCompanyHashedImageDirectory(empresaId);
    const filePath = resolve(directory, sha256);
    if (!filePath.startsWith(`${directory}${sep}`)) {
      throw new BadRequestException('El hash de imagen no es válido.');
    }
    return filePath;
  }

  getCompanyFilePath(empresaId: number, filename: string) {
    this.validateFilename(filename);
    const directory = this.getCompanyDirectory(empresaId);
    const filePath = resolve(directory, filename);
    if (!filePath.startsWith(`${directory}${sep}`)) {
      throw new BadRequestException('El nombre del archivo no es válido.');
    }
    return filePath;
  }

  async ensureCompanyDirectory(empresaId: number) {
    const directory = this.getCompanyDirectory(empresaId);
    await mkdir(directory, { recursive: true });
    return directory;
  }

  async ensureCompanyAssetDirectory(
    empresaId: number,
    collection: CompanyMediaCollection,
    resourceId: number | bigint,
  ) {
    const directory = this.getCompanyAssetDirectory(
      empresaId,
      collection,
      resourceId,
    );
    await mkdir(directory, { recursive: true });
    return directory;
  }

  async ensureCompanyHashedImageDirectory(empresaId: number) {
    const directory = this.getCompanyHashedImageDirectory(empresaId);
    await mkdir(directory, { recursive: true });
    return directory;
  }

  async removeCompanyAssetDirectory(
    empresaId: number,
    collection: CompanyMediaCollection,
    resourceId: number | bigint,
  ) {
    await rm(this.getCompanyAssetDirectory(empresaId, collection, resourceId), {
      recursive: true,
      force: true,
    });
  }

  async removeCompanyDirectory(empresaId: number) {
    await rm(this.getCompanyDirectory(empresaId), {
      recursive: true,
      force: true,
    });
  }

  private getStorageRoot() {
    const configuredPath = this.config.get<string>('COMPANY_MEDIA_DIR');
    return resolve(configuredPath?.trim() || join(process.cwd(), '.storage'));
  }

  private validateId(id: number, label: string) {
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException(
        `El identificador de ${label} no es válido.`,
      );
    }
  }

  private validateFilename(filename: string) {
    if (
      !filename ||
      filename === '.' ||
      filename === '..' ||
      filename !== basename(filename) ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new BadRequestException('El nombre del archivo no es válido.');
    }
  }
}
