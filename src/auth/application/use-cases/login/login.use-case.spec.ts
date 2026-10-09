/// <reference types="jest" />

import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';
import { Usuario } from '@/usuario/domain/usuario.entity';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher';
import type { AuthTokenProvider } from '../../ports/auth-token-provider';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials.exception';
import { LoginCommand } from './login.command';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  const superadmin = Usuario.rehydrate({
    id: 7,
    nombre: 'root',
    passwordHash: 'bcrypt-hash',
    role: Role.SUPERADMIN,
    id_empresa: null,
  });
  const findByNombre = jest.fn<Promise<Usuario | null>, [string]>();
  const findById = jest.fn<Promise<Usuario | null>, [number]>();
  const update = jest.fn<Promise<Usuario | null>, [number, Usuario]>();
  const usuarios = {
    findByNombre,
    findById,
    update,
  } as unknown as UsuarioRepository;
  const hash = jest.fn<Promise<string>, [string]>();
  const verify = jest.fn<Promise<boolean>, [string, string]>();
  const passwordHasher = { hash, verify } as PasswordHasher;
  const hashRefreshToken = jest.fn<string, [string]>();
  const matchesRefreshToken = jest.fn<boolean, [string, string]>();
  const refreshTokenHasher = {
    hash: hashRefreshToken,
    matches: matchesRefreshToken,
  } as RefreshTokenHasher;
  const issueAccessToken = jest.fn<Promise<string>, [number]>();
  const issueRefreshToken = jest.fn<Promise<string>, [number]>();
  const verifyAccessToken = jest.fn<Promise<number | null>, [string]>();
  const verifyRefreshToken = jest.fn<Promise<number | null>, [string]>();
  const tokens = {
    issueAccessToken,
    issueRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    accessTokenExpiresInSeconds: 900,
    refreshTokenExpiresInSeconds: 604_800,
  } as AuthTokenProvider;
  const useCase = new LoginUseCase(
    usuarios,
    passwordHasher,
    refreshTokenHasher,
    tokens,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('issues a session for a superadmin with a valid password', async () => {
    findByNombre.mockResolvedValue(superadmin);
    verify.mockResolvedValue(true);
    issueAccessToken.mockResolvedValue('access-token');
    issueRefreshToken.mockResolvedValue('refresh-token');
    hashRefreshToken.mockReturnValue('hashed-refresh-token');
    update.mockResolvedValue(superadmin);

    await expect(
      useCase.execute(new LoginCommand(' root ', 'correcta')),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresInSeconds: 900,
      refreshTokenExpiresInSeconds: 604_800,
    });
    expect(findByNombre).toHaveBeenCalledWith('root');
    expect(verify).toHaveBeenCalledWith('correcta', 'bcrypt-hash');
    expect(issueAccessToken).toHaveBeenCalledWith(7);
    expect(issueRefreshToken).toHaveBeenCalledWith(7);
    expect(hashRefreshToken).toHaveBeenCalledWith('refresh-token');
    expect(update).toHaveBeenCalledWith(7, superadmin);
    expect(superadmin.refreshTokenHash).toBe('hashed-refresh-token');
  });

  it('rejects invalid credentials without disclosing whether the user exists', async () => {
    findByNombre.mockResolvedValue(null);

    await expect(
      useCase.execute(new LoginCommand('missing', 'incorrecta')),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects users without the superadmin role', async () => {
    const admin = Usuario.rehydrate({
      id: 8,
      nombre: 'empresa',
      passwordHash: 'admin-hash',
      role: Role.ADMIN,
      id_empresa: 3,
    });
    findByNombre.mockResolvedValue(admin);

    await expect(
      useCase.execute(new LoginCommand('empresa', 'correcta')),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
    expect(verify).not.toHaveBeenCalled();
  });
});
