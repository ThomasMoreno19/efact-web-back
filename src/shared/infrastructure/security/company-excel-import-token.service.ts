import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { timingSafeEqual } from 'node:crypto';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import {
  createCompanyExcelImportToken,
  decryptCompanyExcelImportToken,
  deriveCompanyExcelImportEncryptionKey,
  encryptCompanyExcelImportToken,
} from './company-excel-import-token.crypto';

@Injectable()
export class CompanyExcelImportTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  createToken(empresaId: number): string {
    return createCompanyExcelImportToken(empresaId);
  }

  encryptToken(token: string): string {
    return encryptCompanyExcelImportToken(token, this.encryptionKey());
  }

  decryptToken(value: string): string {
    const key = this.encryptionKey();
    try {
      return decryptCompanyExcelImportToken(value, key);
    } catch {
      throw new InternalServerErrorException(
        'No se pudo recuperar el token de importación.',
      );
    }
  }

  async authenticate(token: string): Promise<number | null> {
    const match = /^efact_excel_v1_(\d{1,10})_([A-Za-z0-9_-]{43})$/.exec(token);
    if (!match) return null;

    const empresaId = Number(match[1]);
    if (!Number.isSafeInteger(empresaId) || empresaId < 1) return null;

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { excelImportToken: true },
    });
    if (!empresa?.excelImportToken) return null;

    const storedToken = this.decryptToken(empresa.excelImportToken);
    const provided = Buffer.from(token, 'utf8');
    const expected = Buffer.from(storedToken, 'utf8');
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      return null;
    }

    return empresaId;
  }

  async getOrCreateToken(empresaId: number): Promise<string | null> {
    return this.prisma.$transaction(async (transaction) => {
      const lockedCompany = await transaction.$queryRaw<Array<{ id: number }>>(
        Prisma.sql`SELECT id FROM empresa WHERE id = ${empresaId} FOR UPDATE`,
      );
      if (lockedCompany.length === 0) return null;

      const empresa = await transaction.empresa.findUnique({
        where: { id: empresaId },
        select: { excelImportToken: true },
      });
      if (!empresa) return null;
      if (empresa.excelImportToken) {
        return this.decryptToken(empresa.excelImportToken);
      }

      const token = this.createToken(empresaId);
      await transaction.empresa.update({
        where: { id: empresaId },
        data: { excelImportToken: this.encryptToken(token) },
      });
      return token;
    });
  }

  private encryptionKey(): Buffer {
    const secret = this.config.get<string>('EXCEL_IMPORT_TOKEN_ENCRYPTION_KEY');
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new InternalServerErrorException(
        'Configurá EXCEL_IMPORT_TOKEN_ENCRYPTION_KEY con al menos 32 bytes.',
      );
    }
    return deriveCompanyExcelImportEncryptionKey(secret);
  }
}
