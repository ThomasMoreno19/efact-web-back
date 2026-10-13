import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import {
  EMPRESA_REPOSITORY,
  type EmpresaRepository,
} from '@/empresa/application/ports/empresa.repository';
import { EmpresaModule } from '@/empresa/infrastructure/empresa.module';
import { PASSWORD_HASHER } from '@/shared/application/ports/password-hasher';
import { PrismaModule } from '@/shared/infrastructure/prisma/prisma.module';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { BcryptPasswordHasher } from '@/shared/infrastructure/security/bcrypt-password-hasher';
import { USUARIO_REPOSITORY } from '@/usuario/application/ports/usuario.repository';
import { PrismaUsuarioRepository } from '@/usuario/infrastructure/adapters/out/prisma-usuario.repository';
import { AUTH_TOKEN_PROVIDER } from '../application/ports/auth-token-provider';
import { REFRESH_TOKEN_HASHER } from '../application/ports/refresh-token-hasher';
import { GetSessionUseCase } from '../application/use-cases/get-session/get-session.use-case';
import { LoginUseCase } from '../application/use-cases/login/login.use-case';
import { LoginInternoUseCase } from '../application/use-cases/login-interno/login-interno.use-case';
import { LogoutUseCase } from '../application/use-cases/logout/logout.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token/refresh-token.use-case';
import { AuthController } from './adapters/in/auth.controller';
import { JwtAuthGuard } from './adapters/in/guards/jwt-auth.guard';
import { NestJwtTokenProvider } from './adapters/out/nest-jwt-token.provider';
import { Sha256RefreshTokenHasher } from './adapters/out/sha256-refresh-token.hasher';

@Module({
  imports: [PrismaModule, EmpresaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    NestJwtTokenProvider,
    { provide: AUTH_TOKEN_PROVIDER, useExisting: NestJwtTokenProvider },
    Sha256RefreshTokenHasher,
    { provide: REFRESH_TOKEN_HASHER, useExisting: Sha256RefreshTokenHasher },
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    {
      provide: USUARIO_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaUsuarioRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        repository: PrismaUsuarioRepository,
        empresas: EmpresaRepository,
        passwordHasher: BcryptPasswordHasher,
        refreshTokenHasher: Sha256RefreshTokenHasher,
        tokenProvider: NestJwtTokenProvider,
      ) =>
        new LoginUseCase(
          repository,
          empresas,
          passwordHasher,
          refreshTokenHasher,
          tokenProvider,
        ),
      inject: [
        USUARIO_REPOSITORY,
        EMPRESA_REPOSITORY,
        PASSWORD_HASHER,
        REFRESH_TOKEN_HASHER,
        AUTH_TOKEN_PROVIDER,
      ],
    },
    {
      provide: LoginInternoUseCase,
      useFactory: (
        repository: PrismaUsuarioRepository,
        passwordHasher: BcryptPasswordHasher,
        refreshTokenHasher: Sha256RefreshTokenHasher,
        tokenProvider: NestJwtTokenProvider,
      ) =>
        new LoginInternoUseCase(
          repository,
          passwordHasher,
          refreshTokenHasher,
          tokenProvider,
        ),
      inject: [
        USUARIO_REPOSITORY,
        PASSWORD_HASHER,
        REFRESH_TOKEN_HASHER,
        AUTH_TOKEN_PROVIDER,
      ],
    },
    {
      provide: GetSessionUseCase,
      useFactory: (
        repository: PrismaUsuarioRepository,
        empresas: EmpresaRepository,
        tokenProvider: NestJwtTokenProvider,
      ) => new GetSessionUseCase(repository, empresas, tokenProvider),
      inject: [USUARIO_REPOSITORY, EMPRESA_REPOSITORY, AUTH_TOKEN_PROVIDER],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        repository: PrismaUsuarioRepository,
        refreshTokenHasher: Sha256RefreshTokenHasher,
        tokenProvider: NestJwtTokenProvider,
      ) =>
        new RefreshTokenUseCase(repository, refreshTokenHasher, tokenProvider),
      inject: [USUARIO_REPOSITORY, REFRESH_TOKEN_HASHER, AUTH_TOKEN_PROVIDER],
    },
    {
      provide: LogoutUseCase,
      useFactory: (repository: PrismaUsuarioRepository) =>
        new LogoutUseCase(repository),
      inject: [USUARIO_REPOSITORY],
    },
  ],
  exports: [AUTH_TOKEN_PROVIDER, LogoutUseCase],
})
export class AuthModule {}
