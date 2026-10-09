import { UsuarioNotFoundException } from '../../exceptions/usuario-not-found.exception';
import { UsuarioRepository } from '../../ports/usuario.repository';

export class DeleteUsuarioUseCase {
  constructor(private readonly repository: UsuarioRepository) {}

  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new UsuarioNotFoundException(id);
    }
  }
}
