import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_TOKEN_PROVIDER } from '@/auth/application/ports/auth-token-provider';
import type { AuthTokenProvider } from '@/auth/application/ports/auth-token-provider';
import { EMPRESA_REPOSITORY } from '@/empresa/application/ports/empresa.repository';
import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import { USUARIO_REPOSITORY } from '@/usuario/application/ports/usuario.repository';
import type { UsuarioRepository } from '@/usuario/application/ports/usuario.repository';
import { Role } from '@/usuario/domain/role.enum';

@Injectable()
export class ExternoCatalogoGuard implements CanActivate {
  constructor(
    @Inject(AUTH_TOKEN_PROVIDER) private readonly tokens: AuthTokenProvider,
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    @Inject(EMPRESA_REPOSITORY) private readonly empresas: EmpresaRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const empresaId = Number(request.params.empresaId);
    const empresa = Number.isSafeInteger(empresaId) ? await this.empresas.findById(empresaId) : null;
    if (!empresa || !empresa.configuracion.catalogoHabilitado) throw new ForbiddenException();
    const externos = await this.usuarios.findExternosByEmpresa(empresaId);
    if (externos.length === 0) return true;
    const bearer = /^Bearer\s+(.+)$/i.exec(request.headers.authorization ?? '')?.[1]?.trim();
    const token = bearer || (request as Request & { cookies?: Record<string, string> }).cookies?.access_token;
    if (!token) throw new UnauthorizedException();
    const userId = await this.tokens.verifyAccessToken(token);
    if (userId === null) throw new UnauthorizedException();
    const usuario = await this.usuarios.findById(userId);
    if (!usuario || usuario.role !== Role.EXTERNO || usuario.id_empresa !== empresaId) {
      throw new ForbiddenException();
    }
    return true;
  }
}
