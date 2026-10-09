/// <reference types="jest" />

import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join, resolve } from 'node:path';
import { CompanyMediaStorageService } from './company-media-storage.service';

describe('CompanyMediaStorageService', () => {
  const root = resolve('C:/efact/.storage');
  const storage = new CompanyMediaStorageService({
    get: jest.fn().mockReturnValue(root),
  } as unknown as ConfigService);

  it('partitions media directories by company and resource', () => {
    expect(storage.getCompanyDirectory(12)).toBe(join(root, '12'));
    expect(storage.getCompanyAssetDirectory(12, 'articulos', 901)).toBe(
      join(root, '12', 'articulos', '901'),
    );
    expect(storage.getCompanyAssetDirectory(13, 'marcas', 24)).toBe(
      join(root, '13', 'marcas', '24'),
    );
  });

  it('rejects invalid ids and filenames that could escape a company directory', () => {
    expect(() => storage.getCompanyDirectory(0)).toThrow(BadRequestException);
    for (const filename of ['../logo.png', '..', '.', 'folder/logo.png']) {
      expect(() => storage.getCompanyFilePath(12, filename)).toThrow(
        BadRequestException,
      );
    }
  });
});
