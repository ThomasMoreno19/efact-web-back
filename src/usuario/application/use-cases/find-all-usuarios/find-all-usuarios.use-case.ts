import { UsuarioMapper } from '../../mappers/usuario.mapper';
import { UsuarioRepository } from '../../ports/usuario.repository';

export class FindAllUsuariosUseCase {
  constructor(private readonly repository: UsuarioRepository) {}

  async execute() {
    const usuarios = await this.repository.findAll();
    return usuarios.map((usuario) => UsuarioMapper.toResponse(usuario));
  }
}
