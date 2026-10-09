import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import { EmpresaNotFoundException } from '@/empresa/application/exceptions/empresa-not-found.exception';
import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import { Role } from '../../../domain/role.enum';
import { Usuario } from '../../../domain/usuario.entity';
import type { UsuarioRepository } from '../../ports/usuario.repository';
import { UsuarioMapper } from '../../mappers/usuario.mapper';

export class CreateInternoUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly empresas: EmpresaRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(idEmpresa: number, nombre: string, contrasena: string) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa) throw new EmpresaNotFoundException(idEmpresa);

    const usuario = Usuario.create({
      nombre,
      passwordHash: await this.passwordHasher.hash(contrasena),
      role: Role.INTERNO,
      id_empresa: idEmpresa,
    });
    return UsuarioMapper.toResponse(await this.usuarios.create(usuario));
  }
}
