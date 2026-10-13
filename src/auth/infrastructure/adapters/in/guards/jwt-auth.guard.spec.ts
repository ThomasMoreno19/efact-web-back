/// <reference types="jest" />

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role } from '@/usuario/domain/role.enum';
import type { AuthSession } from '../../../../application/use-cases/get-session/get-session.use-case';
import { GetSessionUseCase } from '../../../../application/use-cases/get-session/get-session.use-case';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestWithUser extends Request {
  user: AuthSession;
}

describe('JwtAuthGuard', () => {
  const handler = jest.fn();
  class TestController {}

  const createContext = (request: RequestWithUser) =>
    ({
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  let reflector: { getAllAndOverride: jest.Mock };
  let getSession: { execute: jest.Mock };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    getSession = { execute: jest.fn() };
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      getSession as unknown as GetSessionUseCase,
    );
  });

  it('allows routes marked public without looking for a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(
      guard.canActivate(
        createContext({ headers: {} } as unknown as RequestWithUser),
      ),
    ).resolves.toBe(true);
    expect(getSession.execute).not.toHaveBeenCalled();
  });

  it('rejects requests without a bearer token', async () => {
    await expect(
      guard.canActivate(
        createContext({ headers: {} } as unknown as RequestWithUser),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(getSession.execute).not.toHaveBeenCalled();
  });

  it('validates bearer tokens and attaches the authenticated user', async () => {
    const session: AuthSession = {
      id: 1,
      nombre: 'admin',
      role: Role.SUPERADMIN,
      id_empresa: null,
      empresaSlug: null,
    };
    const request = {
      headers: { authorization: 'Bearer signed-token' },
    } as unknown as RequestWithUser;
    getSession.execute.mockResolvedValue(session);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(getSession.execute).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'signed-token' }),
    );
    expect(request.user).toEqual(session);
  });
});
