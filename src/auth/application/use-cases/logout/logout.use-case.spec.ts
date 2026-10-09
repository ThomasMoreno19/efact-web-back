/// <reference types="jest" />

import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';
import { Usuario } from '@/usuario/domain/usuario.entity';
import { LogoutCommand } from './logout.command';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  const usuario = Usuario.rehydrate({
    id: 7,
    nombre: 'root',
    passwordHash: 'password-hash',
    role: Role.SUPERADMIN,
    id_empresa: null,
    refreshTokenHash: 'refresh-hash',
  });
  const findById = jest.fn<Promise<Usuario | null>, [number]>();
  const update = jest.fn<Promise<Usuario | null>, [number, Usuario]>();
  const usuarios = {
    findById,
    findByNombre: jest.fn<Promise<Usuario | null>, [string]>(),
    update,
  } as unknown as UsuarioRepository;
  const useCase = new LogoutUseCase(usuarios);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revokes the current refresh token', async () => {
    findById.mockResolvedValue(usuario);
    update.mockResolvedValue(usuario);

    await expect(
      useCase.execute(new LogoutCommand(7)),
    ).resolves.toBeUndefined();

    expect(usuario.refreshTokenHash).toBeNull();
    expect(update).toHaveBeenCalledWith(7, usuario);
  });
});
