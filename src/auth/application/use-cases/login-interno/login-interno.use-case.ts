import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import type { Usuario } from '@/usuario/domain/usuario.entity';
import { Role } from '@/usuario/domain/role.enum';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher';
import type { AuthTokenProvider } from '../../ports/auth-token-provider';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials.exception';
import type { LoginResult } from '../login/login.use-case';

export class LoginInternoUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenHasher: RefreshTokenHasher,
    private readonly tokens: AuthTokenProvider,
  ) {}

  async execute(
    idEmpresa: number,
    contrasena: string,
  ): Promise<LoginResult> {
    const usuarios = await this.usuarios.findInternosByEmpresa(idEmpresa);
    let usuario: Usuario | null = null;
    for (const candidato of usuarios) {
      if (await this.passwordHasher.verify(contrasena, candidato.passwordHash)) {
        usuario = candidato;
        break;
      }
    }
    if (
      !usuario ||
      usuario.id === null ||
      usuario.role !== Role.INTERNO ||
      usuario.id_empresa !== idEmpresa
    ) {
      throw new InvalidCredentialsException();
    }

    const accessToken = await this.tokens.issueAccessToken(usuario.id);
    const refreshToken = await this.tokens.issueRefreshToken(usuario.id);
    usuario.update({
      refreshTokenHash: this.refreshTokenHasher.hash(refreshToken),
    });
    const updated = await this.usuarios.update(usuario.id, usuario);
    if (!updated) throw new InvalidCredentialsException();

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresInSeconds: this.tokens.accessTokenExpiresInSeconds,
      refreshTokenExpiresInSeconds: this.tokens.refreshTokenExpiresInSeconds,
    };
  }
}
