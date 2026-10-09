import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { LogoutCommand } from './logout.command';

export class LogoutUseCase {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async execute(command: LogoutCommand): Promise<void> {
    const usuario = await this.usuarios.findById(command.userId);
    if (!usuario) return;

    usuario.update({ refreshTokenHash: null });
    await this.usuarios.update(command.userId, usuario);
  }
}
