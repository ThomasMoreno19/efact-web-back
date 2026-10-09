import { Usuario } from '../../domain/usuario.entity';

export class UsuarioMapper {
  static toResponse(usuario: Usuario) {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      role: usuario.role,
      id_empresa: usuario.id_empresa,
    };
  }
}
