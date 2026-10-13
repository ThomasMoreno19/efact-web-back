/// <reference types="jest" />

import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import type { Empresa } from '@/empresa/domain/empresa.entity';
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
    refreshTokenHash: 'legacy-refresh-hash',
  });
  const findByNombre = jest.fn<Promise<Usuario | null>, [string]>();
  const findById = jest.fn<Promise<Usuario | null>, [number]>();
  const update = jest.fn<Promise<Usuario | null>, [number, Usuario]>();
  const findEmpresaById = jest.fn<Promise<Empresa | null>, [number]>();
  const usuarios = {
    findByNombre,
    findById,
    update,
  } as unknown as UsuarioRepository;
  const empresas = {
    findById: findEmpresaById,
  } as unknown as EmpresaRepository;
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
    empresas,
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
    update.mockResolvedValue(superadmin);

    await expect(
      useCase.execute(new LoginCommand(' root ', 'correcta')),
    ).resolves.toEqual({
      accessToken: 'access-token',
      accessTokenExpiresInSeconds: 900,
      role: Role.SUPERADMIN,
      id_empresa: null,
      empresaSlug: null,
    });
    expect(findByNombre).toHaveBeenCalledWith('root');
    expect(verify).toHaveBeenCalledWith('correcta', 'bcrypt-hash');
    expect(issueAccessToken).toHaveBeenCalledWith(7);
    expect(issueRefreshToken).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(7, superadmin);
    expect(superadmin.refreshTokenHash).toBeNull();
  });

  it('rejects invalid credentials without disclosing whether the user exists', async () => {
    findByNombre.mockResolvedValue(null);

    await expect(
      useCase.execute(new LoginCommand('missing', 'incorrecta')),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('issues a company-scoped session for an Admin user', async () => {
    const admin = Usuario.rehydrate({
      id: 8,
      nombre: 'empresa',
      passwordHash: 'admin-hash',
      role: Role.ADMIN,
      id_empresa: 3,
    });
    findByNombre.mockResolvedValue(admin);
    verify.mockResolvedValue(true);
    findEmpresaById.mockResolvedValue({
      slug: 'empresa-demo',
    } as unknown as Empresa);
    issueAccessToken.mockResolvedValue('admin-access-token');
    issueRefreshToken.mockResolvedValue('admin-refresh-token');
    hashRefreshToken.mockReturnValue('admin-refresh-hash');
    update.mockResolvedValue(admin);

    await expect(
      useCase.execute(new LoginCommand('empresa', 'correcta')),
    ).resolves.toEqual({
      accessToken: 'admin-access-token',
      accessTokenExpiresInSeconds: 900,
      refreshToken: 'admin-refresh-token',
      refreshTokenExpiresInSeconds: 604_800,
      role: Role.ADMIN,
      id_empresa: 3,
      empresaSlug: 'empresa-demo',
    });
    expect(findEmpresaById).toHaveBeenCalledWith(3);
    expect(issueRefreshToken).toHaveBeenCalledWith(8);
    expect(hashRefreshToken).toHaveBeenCalledWith('admin-refresh-token');
    expect(admin.refreshTokenHash).toBe('admin-refresh-hash');
  });
});
