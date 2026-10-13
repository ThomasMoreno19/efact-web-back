import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher';
import type { AuthTokenProvider } from '../../ports/auth-token-provider';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials.exception';
import { LoginCommand } from './login.command';

export interface LoginResult {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken?: string;
  refreshTokenExpiresInSeconds?: number;
}

export interface AdminLoginResult extends LoginResult {
  role: Role.SUPERADMIN | Role.ADMIN;
  id_empresa: number | null;
  empresaSlug: string | null;
}

export class LoginUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly empresas: EmpresaRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenHasher: RefreshTokenHasher,
    private readonly tokens: AuthTokenProvider,
  ) {}

  async execute(command: LoginCommand): Promise<AdminLoginResult> {
    const usuario = await this.usuarios.findByNombre(command.nombre.trim());
    if (
      !usuario ||
      (usuario.role !== Role.SUPERADMIN && usuario.role !== Role.ADMIN) ||
      usuario.id === null ||
      !(await this.passwordHasher.verify(
        command.contrasena,
        usuario.passwordHash,
      ))
    ) {
      throw new InvalidCredentialsException();
    }

    let empresaSlug: string | null = null;
    if (usuario.role === Role.ADMIN) {
      if (usuario.id_empresa === null) throw new InvalidCredentialsException();
      const empresa = await this.empresas.findById(usuario.id_empresa);
      if (!empresa) throw new InvalidCredentialsException();
      empresaSlug = empresa.slug;
    }

    const accessToken = await this.tokens.issueAccessToken(usuario.id);
    if (usuario.role === Role.SUPERADMIN) {
      if (usuario.refreshTokenHash !== null) {
        usuario.update({ refreshTokenHash: null });
        const updated = await this.usuarios.update(usuario.id, usuario);
        if (!updated) throw new InvalidCredentialsException();
      }

      return {
        accessToken,
        accessTokenExpiresInSeconds: this.tokens.accessTokenExpiresInSeconds,
        role: Role.SUPERADMIN,
        id_empresa: null,
        empresaSlug: null,
      };
    }

    const refreshToken = await this.tokens.issueRefreshToken(usuario.id);
    usuario.update({
      refreshTokenHash: this.refreshTokenHasher.hash(refreshToken),
    });
    const updated = await this.usuarios.update(usuario.id, usuario);
    if (!updated) throw new InvalidCredentialsException();

    return {
      accessToken,
      accessTokenExpiresInSeconds: this.tokens.accessTokenExpiresInSeconds,
      refreshToken,
      refreshTokenExpiresInSeconds: this.tokens.refreshTokenExpiresInSeconds,
      role: Role.ADMIN,
      id_empresa: usuario.id_empresa,
      empresaSlug,
    };
  }
}
