import { UsuarioNotFoundException } from '../../exceptions/usuario-not-found.exception';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import { PasswordHasher } from '@/shared/application/ports/password-hasher';
import { UsuarioRepository } from '../../ports/usuario.repository';
import { UpdateUsuarioCommand } from './update-usuario.command';

export class UpdateUsuarioUseCase {
  constructor(
    private readonly repository: UsuarioRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(id: number, command: UpdateUsuarioCommand) {
    const usuario = await this.repository.findById(id);
    if (usuario === null) {
      throw new UsuarioNotFoundException(id);
    }

    const passwordHash =
      command.contrasena === undefined
        ? undefined
        : await this.passwordHasher.hash(command.contrasena);

    usuario.update({
      nombre: command.nombre,
      passwordHash,
      role: command.role,
      id_empresa: command.id_empresa,
    });

    const updatedUsuario = await this.repository.update(id, usuario);
    if (updatedUsuario === null) {
      throw new UsuarioNotFoundException(id);
    }
    return UsuarioMapper.toResponse(updatedUsuario);
  }
}
