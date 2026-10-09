/// <reference types="jest" />

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FindEmpresaByIdUseCase } from '../application/use-cases/find-empresa-by-id/find-empresa-by-id.use-case';
import { UpdateEmpresaUseCase } from '../application/use-cases/update-empresa/update-empresa.use-case';
import { CompanyMediaStorageService } from '@/shared/infrastructure/storage/company-media-storage.service';
import {
  EmpresaLogoService,
  MAX_COMPANY_LOGO_BYTES,
} from './empresa-logo.service';

const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const OLD_LOGO_FILENAME =
  'logoEmpresa1-00000000-0000-4000-8000-000000000000.png';

describe('EmpresaLogoService', () => {
  let directory: string;
  let findEmpresa: jest.Mock;
  let updateEmpresa: jest.Mock;
  let service: EmpresaLogoService;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'efact-company-logos-'));
    findEmpresa = jest.fn().mockResolvedValue({
      id: 7,
      logo_url: `/empresas/logos/7/${OLD_LOGO_FILENAME}`,
    });
    updateEmpresa = jest
      .fn()
      .mockImplementation(async (_id: number, input: { logo_url: string }) => ({
        id: 7,
        logo_url: input.logo_url,
      }));

    service = new EmpresaLogoService(
      { execute: findEmpresa } as unknown as FindEmpresaByIdUseCase,
      { execute: updateEmpresa } as unknown as UpdateEmpresaUseCase,
      new CompanyMediaStorageService({
        get: () => directory,
      } as unknown as ConfigService),
    );
    await mkdir(join(directory, '7'), { recursive: true });
    await writeFile(join(directory, '7', OLD_LOGO_FILENAME), 'old logo');
  });

  it('configures the upload limit to 50 MB', () => {
    expect(MAX_COMPANY_LOGO_BYTES).toBe(50 * 1024 * 1024);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('stores a validated image and persists its relative URL', async () => {
    const result = await service.upload(7, {
      buffer: PNG_HEADER,
      size: PNG_HEADER.length,
    });
    const filename = result.logo_url.split('/').pop()!;

    expect(result.logo_url).toMatch(
      /^\/empresas\/logos\/7\/logoEmpresa1-[a-f\d-]{36}\.png$/i,
    );
    expect(await readFile(join(directory, '7', filename))).toEqual(PNG_HEADER);
    expect(updateEmpresa).toHaveBeenCalledWith(7, { logo_url: result.logo_url });
    await expect(
      readFile(join(directory, '7', OLD_LOGO_FILENAME)),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects content that is not a supported image', async () => {
    await expect(
      service.upload(7, { buffer: Buffer.from('not an image'), size: 12 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findEmpresa).not.toHaveBeenCalled();
  });

  it('does not allow paths when resolving a logo filename', async () => {
    await expect(service.read(7, '../secret.png')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes all media under a deleted company directory', async () => {
    const articleDirectory = join(directory, '7', 'articulos', '100');
    await mkdir(articleDirectory, { recursive: true });
    await writeFile(join(articleDirectory, 'logo.png'), PNG_HEADER);

    await service.removeCompanyDirectory(7);

    await expect(readFile(join(articleDirectory, 'logo.png'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});
