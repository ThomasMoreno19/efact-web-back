import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { CompanyMediaStorageService } from '@/shared/infrastructure/storage/company-media-storage.service';
import { ReadCacheService } from '@/shared/infrastructure/cache/read-cache.service';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import {
  MAX_CATALOGO_REGISTRO_IMAGEN_BYTES,
  MAX_CATALOGO_IMAGENES_LOTE_BYTES,
  MAX_CATALOGO_IMAGENES_LOTE_ARCHIVOS,
  MAX_CATALOGO_IMAGENES_LOTE_REGISTROS,
  MAX_CATALOGO_IMAGEN_MANIFEST_BYTES,
  MAX_CATALOGO_IMAGEN_MANIFEST_REGISTROS,
  type CatalogImageManifestRecord,
  type CatalogImageImportPort,
} from '../application/ports/catalog-image-import.port';
import {
  CATALOGO_ADMIN_REPOSITORY,
  type CatalogoAdminRepository,
  type CatalogoLista,
  type CatalogoListaConImagen,
  type CatalogoRegistroActualizacion,
} from '../application/ports/catalogo-admin.repository';

interface UploadedImage {
  buffer: Buffer;
  originalname: string;
  size: number;
}

interface ImageType {
  extension: 'png' | 'jpg' | 'webp';
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
}

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const IMAGE_FILENAME_PATTERN =
  /^catalogo-[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\.(?:png|jpg|webp)$/i;
const IMAGE_HASH_PATTERN = /^[a-f0-9]{64}$/;
const IMAGE_COLLECTION_TABLES: Record<CatalogoListaConImagen, string> = {
  articulos: 'articulo',
  marcas: 'marca',
  proveedores: 'proveedor',
  rubros: 'rubro',
};

type CatalogImageBatchRecord = CatalogImageManifestRecord;

@Injectable()
export class CatalogoRegistroImagenService implements CatalogImageImportPort {
  private readonly logger = new Logger(CatalogoRegistroImagenService.name);

  constructor(
    @Inject(CATALOGO_ADMIN_REPOSITORY)
    private readonly repository: CatalogoAdminRepository,
    private readonly companyStorage: CompanyMediaStorageService,
    private readonly prisma: PrismaService,
    private readonly readCache: ReadCacheService,
  ) {}

  async updateWithImage(
    empresaId: number,
    lista: CatalogoListaConImagen,
    id: string,
    data: CatalogoRegistroActualizacion,
    file: UploadedImage | undefined,
  ) {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BadRequestException('Seleccioná una imagen para el registro.');
    }
    if (file.buffer.length > MAX_CATALOGO_REGISTRO_IMAGEN_BYTES) {
      throw new BadRequestException('La imagen no puede superar los 50 MB.');
    }

    this.detectImageType(file.buffer);
    const oldImageUrl = await this.repository.findImageUrl(
      empresaId,
      lista,
      id,
    );
    if (oldImageUrl === undefined) {
      throw new NotFoundException('No se encontró el registro.');
    }

    const resourceId = this.toStorageId(lista, id);
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    const logoUrl = `/empresas/media/${empresaId}/hash/${sha256}`;
    await this.companyStorage.ensureCompanyHashedImageDirectory(empresaId);
    const filePath = this.companyStorage.getCompanyHashedImageFilePath(
      empresaId,
      sha256,
    );
    let fileCreated = false;
    try {
      await writeFile(filePath, file.buffer, { flag: 'wx' });
      fileCreated = true;
    } catch (error) {
      if (!isFileAlreadyExists(error)) throw error;
      const existing = await readFile(filePath);
      const existingHash = createHash('sha256').update(existing).digest('hex');
      if (existingHash !== sha256) {
        throw new BadRequestException(
          'El archivo de imagen existente no coincide con su hash.',
        );
      }
    }

    let updatedRecord: unknown;
    try {
      updatedRecord = await this.repository.update(empresaId, lista, id, {
        ...data,
        logo_url: logoUrl,
      });
      if (updatedRecord === null) {
        throw new NotFoundException('No se encontró el registro.');
      }
    } catch (error) {
      if (fileCreated) await rm(filePath, { force: true });
      throw error;
    }

    await this.removeStoredImage(empresaId, lista, resourceId, oldImageUrl);
    return updatedRecord;
  }

  async read(
    empresaId: number,
    lista: string,
    recordId: string,
    filename: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    if (
      !this.isImageCollection(lista) ||
      !IMAGE_FILENAME_PATTERN.test(filename)
    ) {
      throw new NotFoundException('No se encontró la imagen.');
    }

    const resourceId = this.parseStorageId(lista, recordId);
    if (resourceId === null) {
      throw new NotFoundException('No se encontró la imagen.');
    }

    const imageType = this.imageTypeFromFilename(filename);
    try {
      const buffer = await readFile(
        this.companyStorage.getCompanyAssetFilePath(
          empresaId,
          lista,
          resourceId,
          filename,
        ),
      );
      return { buffer, contentType: imageType.contentType };
    } catch (error) {
      if (isFileNotFound(error)) {
        throw new NotFoundException('No se encontró la imagen.');
      }
      throw error;
    }
  }

  async readHashed(
    empresaId: number,
    sha256: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    if (!IMAGE_HASH_PATTERN.test(sha256)) {
      throw new NotFoundException('No se encontró la imagen.');
    }

    try {
      const buffer = await readFile(
        this.companyStorage.getCompanyHashedImageFilePath(empresaId, sha256),
      );
      return { buffer, contentType: this.detectImageType(buffer).contentType };
    } catch (error) {
      if (isFileNotFound(error)) {
        throw new NotFoundException('No se encontró la imagen.');
      }
      throw error;
    }
  }

  parseImportImageManifest(value: unknown): CatalogImageBatchRecord[] {
    return this.parseImageRecords(
      value,
      MAX_CATALOGO_IMAGEN_MANIFEST_REGISTROS,
      MAX_CATALOGO_IMAGEN_MANIFEST_BYTES,
    );
  }

  private async findStoredHashes(empresaId: number, hashes: string[]) {
    let entries: Dirent[];
    try {
      entries = await readdir(
        this.companyStorage.getCompanyHashedImageDirectory(empresaId),
        { withFileTypes: true },
      );
    } catch (error) {
      if (isFileNotFound(error)) return [];
      throw error;
    }

    const stored = new Set(
      entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
    );
    return hashes.filter((hash) => stored.has(hash));
  }

  async applyImportImageManifest(
    empresaId: number,
    records: CatalogImageBatchRecord[],
  ) {
    const hashes = [
      ...new Set(
        records.flatMap((record) => (record.sha256 ? [record.sha256] : [])),
      ),
    ];
    const existingHashes = new Set(
      await this.findStoredHashes(empresaId, hashes),
    );
    const immediatelyApplicable = records.filter(
      (record) => record.sha256 === null || existingHashes.has(record.sha256),
    );
    const updated = emptyImageCounts();

    for (
      let start = 0;
      start < immediatelyApplicable.length;
      start += MAX_CATALOGO_IMAGENES_LOTE_REGISTROS
    ) {
      const batch = immediatelyApplicable.slice(
        start,
        start + MAX_CATALOGO_IMAGENES_LOTE_REGISTROS,
      );
      const result = await this.applyImageBatch(
        empresaId,
        JSON.stringify(batch),
        undefined,
      );
      for (const lista of Object.keys(updated) as CatalogoListaConImagen[]) {
        updated[lista] += result.updated[lista];
      }
    }

    return {
      requiredHashes: hashes.filter((hash) => !existingHashes.has(hash)),
      imagesReused: existingHashes.size,
      updated,
    };
  }

  async applyImageBatch(
    empresaId: number,
    recordsValue: unknown,
    filesValue: UploadedImage[] | undefined,
  ) {
    const records = this.parseImageBatchRecords(recordsValue);
    const files = filesValue ?? [];
    if (files.length > MAX_CATALOGO_IMAGENES_LOTE_ARCHIVOS) {
      throw new BadRequestException(
        `Cada lote puede incluir hasta ${MAX_CATALOGO_IMAGENES_LOTE_ARCHIVOS} archivos de imagen.`,
      );
    }

    let totalBytes = 0;
    const fileByHash = new Map<string, Buffer>();
    for (const file of files) {
      if (
        !file ||
        !Buffer.isBuffer(file.buffer) ||
        file.buffer.length === 0 ||
        file.buffer.length > MAX_CATALOGO_REGISTRO_IMAGEN_BYTES ||
        !IMAGE_HASH_PATTERN.test(file.originalname)
      ) {
        throw new BadRequestException(
          'Uno de los archivos de imagen no es válido.',
        );
      }
      totalBytes += file.buffer.length;
      if (totalBytes > MAX_CATALOGO_IMAGENES_LOTE_BYTES) {
        throw new BadRequestException(
          'El lote de imágenes no puede superar los 80 MB.',
        );
      }

      const actualHash = createHash('sha256').update(file.buffer).digest('hex');
      if (actualHash !== file.originalname) {
        throw new BadRequestException(
          'El hash informado no coincide con el contenido de la imagen.',
        );
      }
      this.detectImageType(file.buffer);
      if (fileByHash.has(actualHash)) {
        throw new BadRequestException(
          'El lote contiene más de un archivo con el mismo hash.',
        );
      }
      fileByHash.set(actualHash, file.buffer);
    }

    const referencedHashes = new Set(
      records.flatMap((record) => (record.sha256 ? [record.sha256] : [])),
    );
    if ([...fileByHash.keys()].some((hash) => !referencedHashes.has(hash))) {
      throw new BadRequestException(
        'El lote incluye una imagen que no está asociada a ningún registro.',
      );
    }

    const existingHashes = new Set(
      await this.findStoredHashes(empresaId, [...referencedHashes]),
    );
    for (const hash of referencedHashes) {
      if (!existingHashes.has(hash) && !fileByHash.has(hash)) {
        throw new BadRequestException(
          `No se recibió el archivo de imagen con hash ${hash}.`,
        );
      }
    }

    const storageDirectory =
      fileByHash.size > 0
        ? await this.companyStorage.ensureCompanyHashedImageDirectory(empresaId)
        : null;
    let imagesUploaded = 0;
    const imagesReused = existingHashes.size;
    for (const [hash, buffer] of fileByHash) {
      const filePath = this.companyStorage.getCompanyHashedImageFilePath(
        empresaId,
        hash,
      );
      if (existingHashes.has(hash)) {
        const storedBuffer = await readFile(filePath);
        if (createHash('sha256').update(storedBuffer).digest('hex') !== hash) {
          throw new BadRequestException(
            'El archivo de imagen existente no coincide con su hash.',
          );
        }
        continue;
      }

      if (!storageDirectory) {
        throw new BadRequestException('No se pudo preparar el almacenamiento.');
      }
      try {
        await writeFile(filePath, buffer, { flag: 'wx' });
        imagesUploaded += 1;
      } catch (error) {
        if (!isFileAlreadyExists(error)) throw error;
        const storedBuffer = await readFile(filePath);
        if (createHash('sha256').update(storedBuffer).digest('hex') !== hash) {
          throw new BadRequestException(
            'El archivo de imagen existente no coincide con su hash.',
          );
        }
      }
    }

    const updated = emptyImageCounts();
    const previousImages: Array<{
      lista: CatalogoListaConImagen;
      id: number | bigint;
      logoUrl: string | null;
    }> = [];
    await this.prisma.$transaction(async (transaction) => {
      for (const lista of Object.keys(
        IMAGE_COLLECTION_TABLES,
      ) as CatalogoListaConImagen[]) {
        const updates = records.filter((record) => record.lista === lista);
        if (updates.length === 0) continue;

        const table = Prisma.raw(IMAGE_COLLECTION_TABLES[lista]);
        const ids = updates.map((record) =>
          this.parseStorageId(lista, record.id)!,
        );
        const existing = await transaction.$queryRaw<
          Array<{ id: number | bigint; logo_url: string | null }>
        >(Prisma.sql`
          SELECT id, logo_url
          FROM ${table}
          WHERE id_empresa = ${empresaId}
            AND id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}`))})
        `);
        const existingIds = new Set(existing.map(({ id }) => String(id)));
        if (updates.some(({ id }) => !existingIds.has(id))) {
          throw new NotFoundException(
            `No se encontró uno o más registros de la hoja ${sheetForList(lista)}.`,
          );
        }
        const existingById = new Map(
          existing.map((record) => [String(record.id), record]),
        );
        updates.forEach((record, index) => {
          previousImages.push({
            lista,
            id: ids[index],
            logoUrl: existingById.get(record.id)?.logo_url ?? null,
          });
        });

        const cases = updates.map((record, index) => {
          const logoUrl = record.sha256
            ? `/empresas/media/${empresaId}/hash/${record.sha256}`
            : null;
          return Prisma.sql`WHEN ${ids[index]} THEN ${logoUrl}`;
        });
        await transaction.$executeRaw(Prisma.sql`
          UPDATE ${table}
          SET logo_url = CASE id
            ${Prisma.join(cases, ' ')}
            ELSE logo_url
          END
          WHERE id_empresa = ${empresaId}
            AND id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}`))})
        `);
        updated[lista] = updates.length;
      }
    });
    const changedTables = (
      Object.entries(updated) as [CatalogoListaConImagen, number][]
    )
      .filter(([, count]) => count > 0)
      .map(([table]) => table);
    await Promise.all(
      changedTables.map((table) =>
        this.readCache.invalidateCatalog(empresaId, table, false),
      ),
    );

    for (const previousImage of previousImages) {
      await this.removeStoredImage(
        empresaId,
        previousImage.lista,
        previousImage.id,
        previousImage.logoUrl,
      );
    }

    return {
      updated,
      imagesUploaded,
      imagesReused,
    };
  }

  private parseImageBatchRecords(value: unknown): CatalogImageBatchRecord[] {
    return this.parseImageRecords(
      value,
      MAX_CATALOGO_IMAGENES_LOTE_REGISTROS,
      2_000_000,
    );
  }

  private parseImageRecords(
    value: unknown,
    maxRecords: number,
    maxBytes: number,
  ): CatalogImageBatchRecord[] {
    if (typeof value !== 'string' || value.length > maxBytes) {
      throw new BadRequestException(
        'Los registros de imágenes no son válidos.',
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new BadRequestException(
        'Los registros de imágenes no son válidos.',
      );
    }
    if (!Array.isArray(parsed) || parsed.length > maxRecords) {
      throw new BadRequestException(
        `El manifiesto de imágenes puede incluir hasta ${maxRecords} registros.`,
      );
    }

    const seen = new Set<string>();
    return parsed.map((item) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        throw new BadRequestException(
          'Uno de los registros de imagen no es válido.',
        );
      }
      const value = item as Record<string, unknown>;
      if (
        typeof value.lista !== 'string' ||
        !Object.hasOwn(IMAGE_COLLECTION_TABLES, value.lista) ||
        typeof value.id !== 'string' ||
        (value.sha256 !== null &&
          (typeof value.sha256 !== 'string' ||
            !IMAGE_HASH_PATTERN.test(value.sha256)))
      ) {
        throw new BadRequestException(
          'Uno de los registros de imagen no es válido.',
        );
      }

      const lista = value.lista as CatalogoListaConImagen;
      if (this.parseStorageId(lista, value.id) === null) {
        throw new BadRequestException(
          `El identificador de la hoja ${sheetForList(lista)} no es válido.`,
        );
      }
      const key = `${lista}:${value.id}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          `El registro '${value.id}' aparece más de una vez en el lote.`,
        );
      }
      seen.add(key);
      return {
        lista,
        id: value.id,
        sha256: value.sha256,
      };
    });
  }

  async removeRecordFiles(
    empresaId: number,
    lista: CatalogoLista,
    recordId: string,
  ) {
    if (!this.isImageCollection(lista)) return;
    const resourceId = this.parseStorageId(lista, recordId);
    if (resourceId === null) return;

    try {
      await this.companyStorage.removeCompanyAssetDirectory(
        empresaId,
        lista,
        resourceId,
      );
    } catch {
      this.logger.warn(
        `No se pudo limpiar la imagen del registro '${empresaId}/${lista}/${recordId}'.`,
      );
    }
  }

  private async removeStoredImage(
    empresaId: number,
    lista: CatalogoListaConImagen,
    recordId: number | bigint,
    imageUrl: string | null,
  ) {
    const prefix = `/empresas/media/${empresaId}/${lista}/${recordId.toString()}/`;
    if (!imageUrl?.startsWith(prefix)) return;
    const filename = imageUrl.slice(prefix.length);
    if (!IMAGE_FILENAME_PATTERN.test(filename)) return;

    try {
      await rm(
        this.companyStorage.getCompanyAssetFilePath(
          empresaId,
          lista,
          recordId,
          filename,
        ),
        { force: true },
      );
    } catch {
      this.logger.warn(
        `No se pudo limpiar la imagen anterior del registro '${empresaId}/${lista}/${recordId.toString()}'.`,
      );
    }
  }

  private detectImageType(buffer: Buffer): ImageType {
    if (
      buffer.length >= PNG_SIGNATURE.length &&
      buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
    ) {
      return { extension: 'png', contentType: 'image/png' };
    }
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return { extension: 'jpg', contentType: 'image/jpeg' };
    }
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return { extension: 'webp', contentType: 'image/webp' };
    }
    throw new BadRequestException(
      'El archivo debe ser una imagen PNG, JPG o WebP.',
    );
  }

  private imageTypeFromFilename(filename: string): ImageType {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'png') return { extension, contentType: 'image/png' };
    if (extension === 'jpg') {
      return { extension, contentType: 'image/jpeg' };
    }
    return { extension: 'webp', contentType: 'image/webp' };
  }

  private toStorageId(
    lista: CatalogoListaConImagen,
    id: string,
  ): number | bigint {
    return lista === 'articulos' ? BigInt(id) : Number(id);
  }

  private parseStorageId(
    lista: CatalogoListaConImagen,
    id: string,
  ): number | bigint | null {
    if (!/^\d+$/.test(id)) return null;
    const value = lista === 'articulos' ? BigInt(id) : Number(id);
    if (typeof value === 'bigint') {
      return value > 0n && value <= BigInt('9223372036854775807')
        ? value
        : null;
    }
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  private isImageCollection(value: string): value is CatalogoListaConImagen {
    return Object.hasOwn(IMAGE_COLLECTION_TABLES, value);
  }
}

function emptyImageCounts(): Record<CatalogoListaConImagen, number> {
  return { articulos: 0, marcas: 0, proveedores: 0, rubros: 0 };
}

function sheetForList(lista: CatalogoListaConImagen) {
  switch (lista) {
    case 'articulos':
      return 'Articulo';
    case 'marcas':
      return 'Marca';
    case 'proveedores':
      return 'Proveedor';
    case 'rubros':
      return 'Rubro';
  }
}

function isFileNotFound(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function isFileAlreadyExists(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}
