import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { GetSessionCommand } from '../../../../application/use-cases/get-session/get-session.command';
import type { AuthSession } from '../../../../application/use-cases/get-session/get-session.use-case';
import { GetSessionUseCase } from '../../../../application/use-cases/get-session/get-session.use-case';
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

    request.user = await this.getSession.execute(new GetSessionCommand(token));
    return true;
  }
}
