import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';
import type { AuthTokenProvider } from '../../ports/auth-token-provider';
import { InvalidSessionException } from '../../exceptions/invalid-session.exception';
import { GetSessionCommand } from './get-session.command';

export interface AuthSession {
  id: number;
  nombre: string;
  role: Role;
  id_empresa: number | null;
  empresaSlug: string | null;
}

export class GetSessionUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly empresas: EmpresaRepository,
    private readonly tokens: AuthTokenProvider,
  ) {}

  async execute(command: GetSessionCommand): Promise<AuthSession> {
    const userId = await this.tokens.verifyAccessToken(command.token);
    if (userId === null) throw new InvalidSessionException();

    const usuario = await this.usuarios.findById(userId);
    if (
      !usuario ||
      (usuario.role !== Role.SUPERADMIN && usuario.role !== Role.ADMIN) ||
      usuario.id === null ||
      usuario.nombre === null
    ) {
      throw new InvalidSessionException();
    }

    let empresaSlug: string | null = null;
    if (usuario.role === Role.ADMIN) {
      if (usuario.id_empresa === null) throw new InvalidSessionException();
      const empresa = await this.empresas.findById(usuario.id_empresa);
      if (!empresa) throw new InvalidSessionException();
      empresaSlug = empresa.slug;
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      role: usuario.role,
      id_empresa: usuario.role === Role.ADMIN ? usuario.id_empresa : null,
      empresaSlug,
    };
  }
}
