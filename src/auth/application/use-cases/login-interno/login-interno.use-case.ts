import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
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
    nombre: string,
    contrasena: string,
  ): Promise<LoginResult> {
    const usuario = await this.usuarios.findByNombre(nombre.trim());
    if (
      !usuario ||
      usuario.role !== Role.INTERNO ||
      usuario.id_empresa !== idEmpresa ||
      usuario.id === null ||
      !(await this.passwordHasher.verify(contrasena, usuario.passwordHash))
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
