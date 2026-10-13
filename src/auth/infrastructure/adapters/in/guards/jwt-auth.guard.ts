import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { GetSessionCommand } from '../../../../application/use-cases/get-session/get-session.command';
import type { AuthSession } from '../../../../application/use-cases/get-session/get-session.use-case';
import { GetSessionUseCase } from '../../../../application/use-cases/get-session/get-session.use-case';
import { Role } from '@/usuario/domain/role.enum';
import { IS_PUBLIC_KEY } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';

export interface AuthenticatedRequest extends Request {
  user: AuthSession;
  cookies: Record<string, string>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly getSession: GetSessionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookieToken = request.cookies?.['access_token'];
    const match = /^Bearer\s+(.+)$/i.exec(request.headers.authorization ?? '');
    const token = cookieToken ?? match?.[1]?.trim();
    if (!token) throw new UnauthorizedException();

    const session = await this.getSession.execute(new GetSessionCommand(token));
    if (
      session.role === Role.ADMIN &&
      !canAccessCompany(request, session.id_empresa)
    ) {
      throw new ForbiddenException();
    }
    request.user = session;
    return true;
  }
}

function canAccessCompany(
  request: AuthenticatedRequest,
  idEmpresa: number | null,
) {
  const requestPath = request.path.replace(/\/+$/, '') || '/';
  if (requestPath === '/auth/session' || requestPath === '/auth/logout') {
    return true;
  }
  if (idEmpresa === null) return false;
  if (request.method === 'DELETE' && /^\/empresas\/\d+$/.test(requestPath)) {
    return false;
  }

  const routeParams = request.params as Record<string, string | undefined>;
  const companyId =
    routeParams.idEmpresa ??
    routeParams.empresaId ??
    (requestPath.startsWith('/empresas/') ? routeParams.id : undefined);
  return companyId !== undefined && Number(companyId) === idEmpresa;
}
