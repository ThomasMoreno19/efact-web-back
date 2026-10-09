import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { FindEmpresaByIdUseCase } from '../application/use-cases/find-empresa-by-id/find-empresa-by-id.use-case';
import { UpdateEmpresaUseCase } from '../application/use-cases/update-empresa/update-empresa.use-case';
import { CompanyMediaStorageService } from '@/shared/infrastructure/storage/company-media-storage.service';

export const MAX_COMPANY_LOGO_BYTES = 50 * 1024 * 1024;

interface UploadedLogo {
  buffer: Buffer;
  size: number;
}

interface LogoType {
  extension: 'png' | 'jpg' | 'webp';
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const LOGO_FILENAME_PATTERN = /^logoEmpresa1-[a-f\d-]{36}\.(?:png|jpe?g|webp)$/i;

@Injectable()
export class EmpresaLogoService {
  private readonly logger = new Logger(EmpresaLogoService.name);

  constructor(
    private readonly findEmpresaById: FindEmpresaByIdUseCase,
    private readonly updateEmpresa: UpdateEmpresaUseCase,
    private readonly companyStorage: CompanyMediaStorageService,
  ) {}

  async upload(id: number, file: UploadedLogo | undefined) {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BadRequestException('Seleccioná una imagen para el logo.');
    }
    if (file.buffer.length > MAX_COMPANY_LOGO_BYTES) {
      throw new BadRequestException('El logo no puede superar los 50 MB.');
    }

    const logoType = this.detectLogoType(file.buffer);
    const empresa = await this.findEmpresaById.execute(id);
    const filename = `logoEmpresa1-${randomUUID()}.${logoType.extension}`;
    const logoUrl = `/empresas/logos/${id}/${filename}`;
    await this.companyStorage.ensureCompanyDirectory(id);
    const filePath = this.companyStorage.getCompanyFilePath(id, filename);
    await writeFile(filePath, file.buffer, { flag: 'wx' });

    try {
      const updatedEmpresa = await this.updateEmpresa.execute(id, {
        logo_url: logoUrl,
      });
      await this.removeStoredLogo(id, empresa.logo_url);
      return { logo_url: updatedEmpresa.logo_url };
    } catch (error) {
      await rm(filePath, { force: true });
      throw error;
    }
  }

  async read(
    empresaId: number,
    filename: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    if (!LOGO_FILENAME_PATTERN.test(filename)) {
      throw new NotFoundException('No se encontró el logo.');
    }

    const logoType = this.logoTypeFromFilename(filename);
    try {
      const buffer = await readFile(
        this.companyStorage.getCompanyFilePath(empresaId, filename),
      );
      return { buffer, contentType: logoType.contentType };
    } catch (error) {
      if (isFileNotFound(error)) {
        throw new NotFoundException('No se encontró el logo.');
      }
      throw error;
    }
  }

  async removeStoredLogo(empresaId: number, logoUrl: string | null) {
    const filename = this.managedFilename(empresaId, logoUrl);
    if (!filename) return;

    try {
      await rm(this.companyStorage.getCompanyFilePath(empresaId, filename), {
        force: true,
      });
    } catch {
      this.logger.warn(`No se pudo limpiar el logo local '${filename}'.`);
    }
  }

  async removeCompanyDirectory(empresaId: number) {
    try {
      await this.companyStorage.removeCompanyDirectory(empresaId);
    } catch {
      this.logger.warn(`No se pudo limpiar el almacenamiento de empresa '${empresaId}'.`);
    }
  }

  private detectLogoType(buffer: Buffer): LogoType {
    if (buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
      return { extension: 'png', contentType: 'image/png' };
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { extension: 'jpg', contentType: 'image/jpeg' };
    }
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return { extension: 'webp', contentType: 'image/webp' };
    }
    throw new BadRequestException('El archivo debe ser una imagen PNG, JPG o WebP.');
  }

  private logoTypeFromFilename(filename: string): LogoType {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'png') return { extension, contentType: 'image/png' };
    if (extension === 'jpg' || extension === 'jpeg') {
      return { extension: 'jpg', contentType: 'image/jpeg' };
    }
    return { extension: 'webp', contentType: 'image/webp' };
  }

  private managedFilename(empresaId: number, logoUrl: string | null) {
    const prefix = `/empresas/logos/${empresaId}/`;
    if (!logoUrl?.startsWith(prefix)) return null;
    const filename = logoUrl.slice(prefix.length);
    return LOGO_FILENAME_PATTERN.test(filename) ? filename : null;
  }

}

function isFileNotFound(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
