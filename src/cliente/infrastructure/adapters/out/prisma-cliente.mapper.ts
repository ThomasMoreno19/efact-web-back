import type { Cliente as PrismaCliente, Prisma } from '@prisma/client';
import { currentArgentinaDateAsUtcDate } from '@/shared/infrastructure/current-argentina-date';
import { Cliente } from '../../../domain/cliente.entity';

export class PrismaClienteMapper {
  static toDomain(cliente: PrismaCliente): Cliente {
    return Cliente.rehydrate({
      idEmpresa: cliente.idEmpresa,
      cuil: cliente.cuil,
      nombre: cliente.nombre,
      saldo: cliente.saldo,
      updatedAt: cliente.updatedAt?.toISOString().slice(0, 10) ?? null,
      passwordHash: cliente.contrasena,
      domicilio: cliente.domicilio,
      localidad: cliente.localidad,
      telefonos: cliente.telefonos,
    });
  }

  static toPersistence(cliente: Cliente): Prisma.ClienteUncheckedCreateInput {
    return {
      idEmpresa: cliente.idEmpresa,
      cuil: cliente.cuil.valor,
      nombre: cliente.nombre,
      saldo: cliente.saldo,
      updatedAt: currentArgentinaDateAsUtcDate(),
      contrasena: cliente.passwordHash,
      domicilio: cliente.domicilio,
      localidad: cliente.localidad,
      telefonos: cliente.telefonos,
    };
  }
}
