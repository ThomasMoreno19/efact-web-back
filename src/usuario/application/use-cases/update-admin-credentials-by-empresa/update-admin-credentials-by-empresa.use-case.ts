import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import { EmpresaNotFoundException } from '@/empresa/application/exceptions/empresa-not-found.exception';
import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { UsuarioRepository } from '../../ports/usuario.repository';
import { UpdateAdminCredentialsByEmpresaCommand } from './update-admin-credentials-by-empresa.command';

export class UpdateAdminCredentialsByEmpresaUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly empresas: EmpresaRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    idEmpresa: number,
    command: UpdateAdminCredentialsByEmpresaCommand,
  ) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa) throw new EmpresaNotFoundException(idEmpresa);

    const usuario = await this.usuarios.findAdminByEmpresa(idEmpresa);
    if (!usuario) {
      throw new DomainValidationException(
        'No existe un usuario Admin asociado a esta empresa.',
      );
    }

    const wantsPasswordChange =
      command.contrasenaActual !== undefined ||
      command.contrasenaNueva !== undefined;
    let passwordHash: string | undefined;

    if (wantsPasswordChange) {
      if (!command.contrasenaActual || !command.contrasenaNueva) {
        throw new DomainValidationException(
          'Ingresá la contraseña actual y la nueva contraseña.',
        );
      }
      if (command.contrasenaNueva.length < 6) {
        throw new DomainValidationException(
          'La nueva contraseña debe tener al menos 6 caracteres.',
        );
      }
      if (
        !(await this.passwordHasher.verify(
          command.contrasenaActual,
          usuario.passwordHash,
        ))
      ) {
        throw new DomainValidationException(
          'La contraseña actual no es correcta.',
        );
      }
      passwordHash = await this.passwordHasher.hash(command.contrasenaNueva);
    }

    const usuarioId = usuario.id;
    if (usuarioId === null) {
      throw new DomainValidationException(
        'No se pudo actualizar el usuario Admin de la empresa.',
      );
    }

    usuario.update({ nombre: command.nombre, passwordHash });
    const updatedUsuario = await this.usuarios.update(usuarioId, usuario);
    if (!updatedUsuario) {
      throw new DomainValidationException(
        'No se pudo actualizar el usuario Admin de la empresa.',
      );
    }
    return UsuarioMapper.toResponse(updatedUsuario);
  }
}
