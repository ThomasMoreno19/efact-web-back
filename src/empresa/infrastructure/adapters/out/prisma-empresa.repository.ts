import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { translatePrismaError } from '@/shared/infrastructure/prisma/translate-prisma-error';

import { EmpresaRepository } from '../../../application/ports/empresa.repository';
import { Empresa } from '../../../domain/empresa.entity';
import { CompanyExcelImportTokenService } from '@/shared/infrastructure/security/company-excel-import-token.service';
import {
  READ_CACHE_GROUPS,
  READ_CACHE_TTL_MS,
  ReadCacheService,
} from '@/shared/infrastructure/cache/read-cache.service';
import { PrismaEmpresaMapper } from './prisma-empresa.mapper';

@Injectable()
export class PrismaEmpresaRepository implements EmpresaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelImportTokens: CompanyExcelImportTokenService,
    private readonly readCache: ReadCacheService,
  ) {}

  async findAll(): Promise<Empresa[]> {
    const empresas = await this.readCache.getOrLoad(
      'empresas:all',
      READ_CACHE_GROUPS.empresas,
      READ_CACHE_TTL_MS,
      () => this.prisma.empresa.findMany({ orderBy: { id: 'asc' } }),
    );
    return empresas.map((empresa) => PrismaEmpresaMapper.toDomain(empresa));
  }

  async findById(id: number): Promise<Empresa | null> {
    const empresa = await this.readCache.getOrLoad(
      `empresa:id:${id}`,
      READ_CACHE_GROUPS.empresa(id),
      READ_CACHE_TTL_MS,
      () => this.prisma.empresa.findUnique({ where: { id } }),
    );
    return empresa ? PrismaEmpresaMapper.toDomain(empresa) : null;
  }

  async findBySlug(slug: string): Promise<Empresa | null> {
    const empresaId = await this.readCache.getOrLoad(
      `empresa:slug:${encodeURIComponent(slug)}`,
      READ_CACHE_GROUPS.empresaSlugs,
      READ_CACHE_TTL_MS,
      async () => {
        const empresa = await this.prisma.empresa.findUnique({
          where: { slug },
        });
        if (!empresa) return null;
        await this.readCache.getOrLoad(
          `empresa:id:${empresa.id}`,
          READ_CACHE_GROUPS.empresa(empresa.id),
          READ_CACHE_TTL_MS,
          () => Promise.resolve(empresa),
        );
        return empresa.id;
      },
    );
    return empresaId === null ? null : this.findById(empresaId);
  }

  findExcelImportToken(id: number): Promise<string | null> {
    return this.excelImportTokens.getOrCreateToken(id);
  }

  async findExcelImportEnabled(id: number): Promise<boolean | null> {
    const empresa = await this.findById(id);
    return empresa?.configuracion.habilitarExcel ?? null;
  }

  async create(empresa: Empresa): Promise<Empresa> {
    try {
      const createdEmpresa = await this.prisma.$transaction(
        async (transaction) => {
          const created = await transaction.empresa.create({
            data: PrismaEmpresaMapper.toPersistence(empresa),
          });
          const token = this.excelImportTokens.createToken(created.id);
          return transaction.empresa.update({
            where: { id: created.id },
            data: {
              excelImportToken: this.excelImportTokens.encryptToken(token),
            },
          });
        },
      );
      await Promise.all([
        this.readCache.invalidateCompany(createdEmpresa.id),
        this.readCache.invalidateCompanyData(createdEmpresa.id),
      ]);
      return PrismaEmpresaMapper.toDomain(createdEmpresa);
    } catch (error) {
      translatePrismaError(error);
    }
  }

  async update(id: number, empresa: Empresa): Promise<Empresa | null> {
    try {
      const updatedEmpresa = await this.prisma.empresa.update({
        where: { id },
        data: PrismaEmpresaMapper.toPersistence(empresa),
      });
      await this.readCache.invalidateCompany(id);
      return PrismaEmpresaMapper.toDomain(updatedEmpresa);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return null;
      }
      translatePrismaError(error);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const deleted = await this.prisma.$transaction(async (transaction) => {
        // Delete equipment first so its customer FK does not block the
        // existing company-level cascade. Its movements still cascade as before.
        await transaction.equipo.deleteMany({ where: { id_empresa: id } });
        const result = await transaction.empresa.deleteMany({ where: { id } });
        return result.count > 0;
      });
      if (deleted) {
        await Promise.all([
          this.readCache.invalidateCompany(id),
          this.readCache.invalidateCompanyData(id),
        ]);
      }
      return deleted;
    } catch (error) {
      translatePrismaError(error, 'delete');
    }
  }
}
