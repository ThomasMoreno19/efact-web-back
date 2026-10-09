import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';
import type { AuthTokenProvider } from '../../ports/auth-token-provider';
import { InvalidSessionException } from '../../exceptions/invalid-session.exception';
import { GetSessionCommand } from './get-session.command';

export interface AuthSession {
  id: number;
  nombre: string;
  role: Role;
}

export class GetSessionUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly tokens: AuthTokenProvider,
  ) {}

  async execute(command: GetSessionCommand): Promise<AuthSession> {
    const userId = await this.tokens.verifyAccessToken(command.token);
    if (userId === null) throw new InvalidSessionException();

    const usuario = await this.usuarios.findById(userId);
    if (!usuario || usuario.role !== Role.SUPERADMIN || usuario.id === null) {
      throw new InvalidSessionException();
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      role: usuario.role,
    };
  }
}
