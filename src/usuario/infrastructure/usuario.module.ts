import { Module } from '@nestjs/common';
import {
  EMPRESA_REPOSITORY,
  type EmpresaRepository,
} from '@/empresa/application/ports/empresa.repository';
import { EmpresaModule } from '@/empresa/infrastructure/empresa.module';
import { CreateUsuarioUseCase } from '../application/use-cases/create-usuario/create-usuario.use-case';
import { CreateInternoUseCase } from '../application/use-cases/create-interno/create-interno.use-case';
import { FindInternosByEmpresaUseCase } from '../application/use-cases/find-internos-by-empresa/find-internos-by-empresa.use-case';
import { DeleteUsuarioUseCase } from '../application/use-cases/delete-usuario/delete-usuario.use-case';
import { FindAllUsuariosUseCase } from '../application/use-cases/find-all-usuarios/find-all-usuarios.use-case';
import { FindUsuarioByIdUseCase } from '../application/use-cases/find-usuario-by-id/find-usuario-by-id.use-case';
import { UpdateUsuarioUseCase } from '../application/use-cases/update-usuario/update-usuario.use-case';
import { USUARIO_REPOSITORY } from '../application/ports/usuario.repository';
import { UsuarioController } from './adapters/in/usuario.controller';
import { UsuarioInternoController } from './adapters/in/usuario-interno.controller';
import { PrismaUsuarioRepository } from './adapters/out/prisma-usuario.repository';
import { BcryptPasswordHasher } from '@/shared/infrastructure/security/bcrypt-password-hasher';
import { PASSWORD_HASHER } from '@/shared/application/ports/password-hasher';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

@Module({
  imports: [EmpresaModule],
  controllers: [UsuarioController, UsuarioInternoController],
  providers: [
    BcryptPasswordHasher,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    {
      provide: USUARIO_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaUsuarioRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: FindAllUsuariosUseCase,
      useFactory: (repository: PrismaUsuarioRepository) =>
        new FindAllUsuariosUseCase(repository),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: FindUsuarioByIdUseCase,
      useFactory: (repository: PrismaUsuarioRepository) =>
        new FindUsuarioByIdUseCase(repository),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: CreateUsuarioUseCase,
      useFactory: (
        repository: PrismaUsuarioRepository,
        hasher: BcryptPasswordHasher,
      ) => new CreateUsuarioUseCase(repository, hasher),
      inject: [USUARIO_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: CreateInternoUseCase,
      useFactory: (
        usuarios: PrismaUsuarioRepository,
        empresas: EmpresaRepository,
        passwordHasher: BcryptPasswordHasher,
      ) => new CreateInternoUseCase(usuarios, empresas, passwordHasher),
      inject: [USUARIO_REPOSITORY, EMPRESA_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: FindInternosByEmpresaUseCase,
      useFactory: (
        usuarios: PrismaUsuarioRepository,
        empresas: EmpresaRepository,
      ) => new FindInternosByEmpresaUseCase(usuarios, empresas),
      inject: [USUARIO_REPOSITORY, EMPRESA_REPOSITORY],
    },
    {
      provide: UpdateUsuarioUseCase,
      useFactory: (
        repository: PrismaUsuarioRepository,
        hasher: BcryptPasswordHasher,
      ) => new UpdateUsuarioUseCase(repository, hasher),
      inject: [USUARIO_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: DeleteUsuarioUseCase,
      useFactory: (repository: PrismaUsuarioRepository) =>
        new DeleteUsuarioUseCase(repository),
      inject: [USUARIO_REPOSITORY],
    },
  ],
  exports: [USUARIO_REPOSITORY],
})
export class UsuarioModule {}
