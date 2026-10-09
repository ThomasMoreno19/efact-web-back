import type { Prisma, Usuario as PrismaUsuario } from '@prisma/client';
import { Rol as PrismaRol } from '@prisma/client';
import { Role } from '../../../domain/role.enum';
import { Usuario } from '../../../domain/usuario.entity';

export class PrismaUsuarioMapper {
  static toDomain(usuario: PrismaUsuario): Usuario {
    return Usuario.rehydrate({
      id: usuario.id,
      nombre: usuario.nombre,
      passwordHash: usuario.contrasena,
      role: this.toDomainRole(usuario.role),
      id_empresa: usuario.idEmpresa,
      refreshTokenHash: usuario.refreshTokenHash,
    });
  }

  static toPersistence(usuario: Usuario): Prisma.UsuarioUncheckedCreateInput {
    return {
      nombre: usuario.nombre,
      contrasena: usuario.passwordHash,
      role: this.toPrismaRole(usuario.role),
      idEmpresa: usuario.id_empresa,
      refreshTokenHash: usuario.refreshTokenHash,
    };
  }

  private static toDomainRole(role: PrismaRol): Role {
    switch (role) {
      case PrismaRol.SUPERADMIN:
        return Role.SUPERADMIN;
      case PrismaRol.ADMIN:
        return Role.ADMIN;
      case PrismaRol.INTERNO:
        return Role.INTERNO;
    }
  }

  private static toPrismaRole(role: Role): PrismaRol {
    switch (role) {
      case Role.SUPERADMIN:
        return PrismaRol.SUPERADMIN;
      case Role.ADMIN:
        return PrismaRol.ADMIN;
      case Role.INTERNO:
        return PrismaRol.INTERNO;
    }
  }
}
