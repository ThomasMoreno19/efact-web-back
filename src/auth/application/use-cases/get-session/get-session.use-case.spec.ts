/// <reference types="jest" />

import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';
import { Usuario } from '@/usuario/domain/usuario.entity';
import type { AuthTokenProvider } from '../../ports/auth-token-provider';
import { InvalidSessionException } from '../../exceptions/invalid-session.exception';
import { GetSessionCommand } from './get-session.command';
import { GetSessionUseCase } from './get-session.use-case';

describe('GetSessionUseCase', () => {
  const superadmin = Usuario.rehydrate({
    id: 7,
    nombre: 'root',
    passwordHash: 'bcrypt-hash',
    role: Role.SUPERADMIN,
    id_empresa: null,
  });
  const findById = jest.fn<Promise<Usuario | null>, [number]>();
  const findByNombre = jest.fn<Promise<Usuario | null>, [string]>();
  const usuarios = { findById, findByNombre } as unknown as UsuarioRepository;
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
  const useCase = new GetSessionUseCase(usuarios, tokens);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the current superadmin session', async () => {
    verifyAccessToken.mockResolvedValue(7);
    findById.mockResolvedValue(superadmin);

    await expect(
      useCase.execute(new GetSessionCommand('signed-token')),
    ).resolves.toEqual({ id: 7, nombre: 'root', role: Role.SUPERADMIN });
  });

  it('rejects invalid tokens', async () => {
    verifyAccessToken.mockResolvedValue(null);

    await expect(
      useCase.execute(new GetSessionCommand('invalid-token')),
    ).rejects.toBeInstanceOf(InvalidSessionException);
    expect(findById).not.toHaveBeenCalled();
  });

  it('rejects users who are missing or no longer superadmins', async () => {
    verifyAccessToken.mockResolvedValue(7);
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute(new GetSessionCommand('signed-token')),
    ).rejects.toBeInstanceOf(InvalidSessionException);
  });
});
