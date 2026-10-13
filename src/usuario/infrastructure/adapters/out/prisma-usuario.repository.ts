import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UsuarioRepository } from '../../../application/ports/usuario.repository';
import { Usuario } from '../../../domain/usuario.entity';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { translatePrismaError } from '@/shared/infrastructure/prisma/translate-prisma-error';
import { PrismaUsuarioMapper } from './prisma-usuario.mapper';
import { Rol as PrismaRol } from '@prisma/client';

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Usuario[]> {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { id: 'asc' },
    });
    return usuarios.map((usuario) => PrismaUsuarioMapper.toDomain(usuario));
  }

  async findById(id: number): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    return usuario ? PrismaUsuarioMapper.toDomain(usuario) : null;
  }

  async findByNombre(nombre: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { nombre } });
    return usuario ? PrismaUsuarioMapper.toDomain(usuario) : null;
  }

  async findAdminByEmpresa(idEmpresa: number): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { idEmpresa, role: PrismaRol.ADMIN },
      orderBy: { id: 'asc' },
    });
    return usuario ? PrismaUsuarioMapper.toDomain(usuario) : null;
  }

  async findInternosByEmpresa(idEmpresa: number): Promise<Usuario[]> {
    const usuarios = await this.prisma.usuario.findMany({
      where: { idEmpresa, role: PrismaRol.INTERNO },
      orderBy: { nombre: 'asc' },
    });
    return usuarios.map((usuario) => PrismaUsuarioMapper.toDomain(usuario));
  }

  async create(usuario: Usuario): Promise<Usuario> {
    try {
      const createdUsuario = await this.prisma.usuario.create({
        data: PrismaUsuarioMapper.toPersistence(usuario),
      });
      return PrismaUsuarioMapper.toDomain(createdUsuario);
    } catch (error) {
      translatePrismaError(error);
    }
  }

  async update(id: number, usuario: Usuario): Promise<Usuario | null> {
    try {
      const updatedUsuario = await this.prisma.usuario.update({
        where: { id },
        data: PrismaUsuarioMapper.toPersistence(usuario),
      });
      return PrismaUsuarioMapper.toDomain(updatedUsuario);
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
      const result = await this.prisma.usuario.deleteMany({ where: { id } });
      return result.count > 0;
    } catch (error) {
      translatePrismaError(error, 'delete');
    }
  }
}
