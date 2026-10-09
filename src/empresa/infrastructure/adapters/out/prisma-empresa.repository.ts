import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { translatePrismaError } from '@/shared/infrastructure/prisma/translate-prisma-error';

import { EmpresaRepository } from '../../../application/ports/empresa.repository';
import { Empresa } from '../../../domain/empresa.entity';
import { CompanyExcelImportTokenService } from '@/shared/infrastructure/security/company-excel-import-token.service';
import { PrismaEmpresaMapper } from './prisma-empresa.mapper';

@Injectable()
export class PrismaEmpresaRepository implements EmpresaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelImportTokens: CompanyExcelImportTokenService,
  ) {}

  async findAll(): Promise<Empresa[]> {
    const empresas = await this.prisma.empresa.findMany({
      orderBy: { id: 'asc' },
    });
    return empresas.map((empresa) => PrismaEmpresaMapper.toDomain(empresa));
  }

  async findById(id: number): Promise<Empresa | null> {
    const empresa = await this.prisma.empresa.findUnique({ where: { id } });
    return empresa ? PrismaEmpresaMapper.toDomain(empresa) : null;
  }

  async findBySlug(slug: string): Promise<Empresa | null> {
    const empresa = await this.prisma.empresa.findUnique({ where: { slug } });
    return empresa ? PrismaEmpresaMapper.toDomain(empresa) : null;
  }

  findExcelImportToken(id: number): Promise<string | null> {
    return this.excelImportTokens.getOrCreateToken(id);
  }

  async findExcelImportEnabled(id: number): Promise<boolean | null> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      select: { habilitarExcel: true },
    });
    return empresa?.habilitarExcel ?? null;
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
      return await this.prisma.$transaction(async (transaction) => {
        // Delete equipment first so its customer FK does not block the
        // existing company-level cascade. Its movements still cascade as before.
        await transaction.equipo.deleteMany({ where: { id_empresa: id } });
        const result = await transaction.empresa.deleteMany({ where: { id } });
        return result.count > 0;
      });
    } catch (error) {
      translatePrismaError(error, 'delete');
    }
  }
}
