import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { AuthSession } from '../../../application/use-cases/get-session/get-session.use-case';
import type { AdminLoginResult } from '../../../application/use-cases/login/login.use-case';
import { LoginCommand } from '../../../application/use-cases/login/login.command';
import type { LoginResult } from '../../../application/use-cases/login/login.use-case';
import { LoginUseCase } from '../../../application/use-cases/login/login.use-case';
import { LoginInternoUseCase } from '../../../application/use-cases/login-interno/login-interno.use-case';
import { LogoutCommand } from '../../../application/use-cases/logout/logout.command';
import { LogoutUseCase } from '../../../application/use-cases/logout/logout.use-case';
import { RefreshTokenCommand } from '../../../application/use-cases/refresh-token/refresh-token.command';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token/refresh-token.use-case';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';
import { LoginDto } from './dtos/login.dto';
import { LoginInternoDto } from './dtos/login-interno.dto';
import type { AuthenticatedRequest } from './guards/jwt-auth.guard';

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly loginInternoUseCase: LoginInternoUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<AdminLoginResult, 'role' | 'empresaSlug'>> {
    const tokens = await this.loginUseCase.execute(
      new LoginCommand(dto.nombre, dto.contrasena),
    );
    this.setAuthCookies(response, tokens);
    return { role: tokens.role, empresaSlug: tokens.empresaSlug };
  }

  @Post('login-interno')
  @Public()
  @HttpCode(HttpStatus.OK)
  async loginInterno(
    @Body() dto: LoginInternoDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const tokens = await this.loginInternoUseCase.execute(
      dto.idEmpresa,
      dto.nombre,
      dto.contrasena,
    );
    this.setAuthCookies(response, tokens);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = request.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();

    const tokens = await this.refreshTokenUseCase.execute(
      new RefreshTokenCommand(refreshToken),
    );
    this.setAuthCookies(response, tokens);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(new LogoutCommand(request.user.id));
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/auth/refresh' });
  }

  @Get('session')
  session(@Req() request: AuthenticatedRequest): AuthSession {
    return request.user;
  }

  private setAuthCookies(response: Response, tokens: LoginResult): void {
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: tokens.accessTokenExpiresInSeconds * 1000,
      path: '/',
    });
    if (
      tokens.refreshToken &&
      tokens.refreshTokenExpiresInSeconds !== undefined
    ) {
      response.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: tokens.refreshTokenExpiresInSeconds * 1000,
        path: '/auth/refresh',
      });
    }
  }
}
