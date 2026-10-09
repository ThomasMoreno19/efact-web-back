/// <reference types="jest" />

import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';
import { Usuario } from '@/usuario/domain/usuario.entity';
import type { RefreshTokenHasher } from '../../ports/refresh-token-hasher';
import type { AuthTokenProvider } from '../../ports/auth-token-provider';
import { InvalidRefreshTokenException } from '../../exceptions/invalid-refresh-token.exception';
import { RefreshTokenCommand } from './refresh-token.command';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  const usuario = Usuario.rehydrate({
    id: 7,
    nombre: 'root',
    passwordHash: 'password-hash',
    role: Role.SUPERADMIN,
    id_empresa: null,
    refreshTokenHash: 'current-refresh-hash',
  });
  const findById = jest.fn<Promise<Usuario | null>, [number]>();
  const update = jest.fn<Promise<Usuario | null>, [number, Usuario]>();
  const usuarios = {
    findById,
    findByNombre: jest.fn<Promise<Usuario | null>, [string]>(),
    update,
  } as unknown as UsuarioRepository;
  const hash = jest.fn<string, [string]>();
  const matches = jest.fn<boolean, [string, string]>();
  const refreshTokenHasher = { hash, matches } as RefreshTokenHasher;
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
  const useCase = new RefreshTokenUseCase(usuarios, refreshTokenHasher, tokens);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rotates a valid refresh token and stores only its hash', async () => {
    findById.mockResolvedValue(usuario);
    verifyRefreshToken.mockResolvedValue(7);
    matches.mockReturnValue(true);
    issueAccessToken.mockResolvedValue('new-access-token');
    issueRefreshToken.mockResolvedValue('new-refresh-token');
    hash.mockReturnValue('new-refresh-hash');
    update.mockResolvedValue(usuario);

    await expect(
      useCase.execute(new RefreshTokenCommand('current-refresh-token')),
    ).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      accessTokenExpiresInSeconds: 900,
      refreshTokenExpiresInSeconds: 604_800,
    });

    expect(matches).toHaveBeenCalledWith(
      'current-refresh-token',
      'current-refresh-hash',
    );
    expect(hash).toHaveBeenCalledWith('new-refresh-token');
    expect(usuario.refreshTokenHash).toBe('new-refresh-hash');
    expect(update).toHaveBeenCalledWith(7, usuario);
  });

  it('rejects a refresh token that does not match the stored hash', async () => {
    findById.mockResolvedValue(usuario);
    verifyRefreshToken.mockResolvedValue(7);
    matches.mockReturnValue(false);

    await expect(
      useCase.execute(new RefreshTokenCommand('replayed-token')),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenException);
    expect(issueAccessToken).not.toHaveBeenCalled();
  });
});
