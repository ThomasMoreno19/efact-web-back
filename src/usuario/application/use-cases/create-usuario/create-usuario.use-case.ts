import { Usuario } from '../../../domain/usuario.entity';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import { PasswordHasher } from '@/shared/application/ports/password-hasher';
import { UsuarioRepository } from '../../ports/usuario.repository';
import { CreateUsuarioCommand } from './create-usuario.command';

export class CreateUsuarioUseCase {
  constructor(
    private readonly repository: UsuarioRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: CreateUsuarioCommand) {
    const passwordHash = await this.passwordHasher.hash(command.contrasena);
    const usuario = Usuario.create({
      nombre: command.nombre,
      passwordHash,
      role: command.role,
      id_empresa: command.id_empresa,
    });
    const createdUsuario = await this.repository.create(usuario);
    return UsuarioMapper.toResponse(createdUsuario);
  }
}
