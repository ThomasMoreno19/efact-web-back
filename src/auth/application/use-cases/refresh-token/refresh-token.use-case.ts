import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher';
import type { AuthTokenProvider } from '../../ports/auth-token-provider';
import { InvalidRefreshTokenException } from '../../exceptions/invalid-refresh-token.exception';
import type { LoginResult } from '../login/login.use-case';
import { RefreshTokenCommand } from './refresh-token.command';

export class RefreshTokenUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly refreshTokenHasher: RefreshTokenHasher,
    private readonly tokens: AuthTokenProvider,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<LoginResult> {
    const userId = await this.tokens.verifyRefreshToken(command.refreshToken);
    if (userId === null) throw new InvalidRefreshTokenException();

    const usuario = await this.usuarios.findById(userId);
    if (
      !usuario ||
      usuario.id === null ||
      (usuario.role !== Role.INTERNO &&
        (usuario.role !== Role.ADMIN || usuario.id_empresa === null)) ||
      !usuario.refreshTokenHash
    ) {
      throw new InvalidRefreshTokenException();
    }

    const tokenMatches = this.refreshTokenHasher.matches(
      command.refreshToken,
      usuario.refreshTokenHash,
    );
    if (!tokenMatches) throw new InvalidRefreshTokenException();

    const accessToken = await this.tokens.issueAccessToken(usuario.id);
    const refreshToken = await this.tokens.issueRefreshToken(usuario.id);
    usuario.update({
      refreshTokenHash: this.refreshTokenHasher.hash(refreshToken),
    });

    const updated = await this.usuarios.update(usuario.id, usuario);
    if (!updated) throw new InvalidRefreshTokenException();

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresInSeconds: this.tokens.accessTokenExpiresInSeconds,
      refreshTokenExpiresInSeconds: this.tokens.refreshTokenExpiresInSeconds,
    };
  }
}
