import { UsuarioNotFoundException } from '../../exceptions/usuario-not-found.exception';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import { UsuarioRepository } from '../../ports/usuario.repository';

export class FindUsuarioByIdUseCase {
  constructor(private readonly repository: UsuarioRepository) {}

  async execute(id: number) {
    const usuario = await this.repository.findById(id);
    if (usuario === null) {
      throw new UsuarioNotFoundException(id);
    }
    return UsuarioMapper.toResponse(usuario);
  }
}
