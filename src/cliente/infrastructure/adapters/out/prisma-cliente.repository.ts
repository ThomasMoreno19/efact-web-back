import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClienteRepository } from '../../../application/ports/cliente.repository';
import { Cliente } from '../../../domain/cliente.entity';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { translatePrismaError } from '@/shared/infrastructure/prisma/translate-prisma-error';
import { IdentificacionCliente } from '../../../domain/identificacion-cliente.value-object';
import { PrismaClienteMapper } from './prisma-cliente.mapper';

@Injectable()
export class PrismaClienteRepository implements ClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(idEmpresa: number): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: { idEmpresa },
      orderBy: { cuil: 'asc' },
    });
    return clientes.map((cliente) => PrismaClienteMapper.toDomain(cliente));
  }

  async findByCuil(
    idEmpresa: number,
    cuil: IdentificacionCliente,
  ): Promise<Cliente | null> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { cuil_idEmpresa: { cuil: cuil.valor, idEmpresa } },
    });
    return cliente ? PrismaClienteMapper.toDomain(cliente) : null;
  }

  async create(cliente: Cliente): Promise<Cliente> {
    try {
      const createdCliente = await this.prisma.cliente.create({
        data: PrismaClienteMapper.toPersistence(cliente),
      });
      return PrismaClienteMapper.toDomain(createdCliente);
    } catch (error) {
      translatePrismaError(error);
    }
  }

  async update(
    idEmpresa: number,
    cuil: IdentificacionCliente,
    cliente: Cliente,
  ): Promise<Cliente | null> {
    try {
      const updatedCliente = await this.prisma.cliente.update({
        where: { cuil_idEmpresa: { cuil: cuil.valor, idEmpresa } },
        data: PrismaClienteMapper.toPersistence(cliente),
      });
      return PrismaClienteMapper.toDomain(updatedCliente);
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

  async delete(
    idEmpresa: number,
    cuil: IdentificacionCliente,
  ): Promise<boolean> {
    try {
      const result = await this.prisma.cliente.deleteMany({
        where: { cuil: cuil.valor, idEmpresa },
      });
      return result.count > 0;
    } catch (error) {
      translatePrismaError(error, 'delete');
    }
  }
}
