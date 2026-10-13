import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import { EmpresaNotFoundException } from '@/empresa/application/exceptions/empresa-not-found.exception';
import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';
import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import { Role } from '../../../domain/role.enum';
import { Usuario } from '../../../domain/usuario.entity';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { UsuarioRepository } from '../../ports/usuario.repository';
import { UpsertAdminByEmpresaCommand } from './upsert-admin-by-empresa.command';

export class UpsertAdminByEmpresaUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly empresas: EmpresaRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(idEmpresa: number, command: UpsertAdminByEmpresaCommand) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa) throw new EmpresaNotFoundException(idEmpresa);

    if (command.contrasena && command.contrasena.length < 6) {
      throw new DomainValidationException(
        'La contraseña debe tener al menos 6 caracteres.',
      );
    }

    const usuario = await this.usuarios.findAdminByEmpresa(idEmpresa);
    if (!usuario) {
      if (!command.contrasena) {
        throw new DomainValidationException(
          'Ingresá una contraseña para el usuario Admin.',
        );
      }

      const newAdmin = Usuario.create({
        nombre: command.nombre,
        passwordHash: await this.passwordHasher.hash(command.contrasena),
        role: Role.ADMIN,
        id_empresa: idEmpresa,
      });
      return UsuarioMapper.toResponse(await this.usuarios.create(newAdmin));
    }

    const usuarioId = usuario.id;
    if (usuarioId === null) {
      throw new DomainValidationException(
        'No se pudo actualizar el usuario Admin de la empresa.',
      );
    }

    const passwordHash = command.contrasena
      ? await this.passwordHasher.hash(command.contrasena)
      : undefined;
    usuario.update({
      nombre: command.nombre,
      passwordHash,
      role: Role.ADMIN,
      id_empresa: idEmpresa,
    });
    const updatedAdmin = await this.usuarios.update(usuarioId, usuario);
    if (!updatedAdmin) {
      throw new DomainValidationException(
        'No se pudo actualizar el usuario Admin de la empresa.',
      );
    }
    return UsuarioMapper.toResponse(updatedAdmin);
  }
}
