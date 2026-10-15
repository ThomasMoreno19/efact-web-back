import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_TOKEN_PROVIDER } from '@/auth/application/ports/auth-token-provider';
import type { AuthTokenProvider } from '@/auth/application/ports/auth-token-provider';
import { Role } from '@/usuario/domain/role.enum';
import { USUARIO_REPOSITORY } from '@/usuario/application/ports/usuario.repository';
import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Inject } from '@nestjs/common';

export interface InternalRequest extends Request {
  interno: {
    id: number;
    idEmpresa: number;
  };
}

@Injectable()
export class InternoAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_TOKEN_PROVIDER)
    private readonly tokens: AuthTokenProvider,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<InternalRequest>();
    const match = /^Bearer\s+(.+)$/i.exec(request.headers.authorization ?? '');
    const token = match?.[1]?.trim();
    if (!token) throw new UnauthorizedException();

    const userId = await this.tokens.verifyAccessToken(token);
    if (userId === null) throw new UnauthorizedException();

    const usuario = await this.usuarios.findById(userId);
    if (
      !usuario ||
      usuario.role !== Role.INTERNO ||
      usuario.id === null ||
      usuario.id_empresa === null
    ) {
      throw new ForbiddenException();
    }

    const requestedCompanyId = Number(request.params.idEmpresa);
    if (requestedCompanyId !== usuario.id_empresa) {
      throw new ForbiddenException();
    }

    request.interno = {
      id: usuario.id,
      idEmpresa: usuario.id_empresa,
    };
    return true;
  }
}
