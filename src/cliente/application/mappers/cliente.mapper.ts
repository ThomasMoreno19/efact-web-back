import { Cliente } from '../../domain/cliente.entity';

export class ClienteMapper {
  static toResponse(cliente: Cliente) {
    return {
      idEmpresa: cliente.idEmpresa,
      cuil: cliente.cuil.valor,
      nombre: cliente.nombre,
      saldo: cliente.saldo,
      updatedAt: cliente.updatedAt,
      domicilio: cliente.domicilio,
      localidad: cliente.localidad,
      telefonos: cliente.telefonos,
    };
  }
}
