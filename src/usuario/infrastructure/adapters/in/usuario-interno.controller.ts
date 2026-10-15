import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateInternoUseCase } from '../../../application/use-cases/create-interno/create-interno.use-case';
import { FindInternosByEmpresaUseCase } from '../../../application/use-cases/find-internos-by-empresa/find-internos-by-empresa.use-case';
import { UpdateUsuarioUseCase } from '../../../application/use-cases/update-usuario/update-usuario.use-case';
import { DeleteUsuarioUseCase } from '../../../application/use-cases/delete-usuario/delete-usuario.use-case';
import { UpdateUsuarioCommand } from '../../../application/use-cases/update-usuario/update-usuario.command';
import { CreateInternoDto } from './dtos/create-interno.dto';
import { UpdateInternoDto } from './dtos/update-interno.dto';
import { Role } from '../../../domain/role.enum';
import { UsuarioNotFoundException } from '../../../application/exceptions/usuario-not-found.exception';
import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';

@Controller('empresas/:idEmpresa/usuarios-internos')
export class UsuarioInternoController {
  constructor(
    private readonly findInternos: FindInternosByEmpresaUseCase,
    private readonly createInterno: CreateInternoUseCase,
    private readonly updateUsuario: UpdateUsuarioUseCase,
    private readonly deleteUsuario: DeleteUsuarioUseCase,
  ) {}

  @Get()
  findAll(@Param('idEmpresa', ParseIntPipe) idEmpresa: number) {
    return this.findInternos.execute(idEmpresa);
  }

  @Post()
  create(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Body() dto: CreateInternoDto,
  ) {
    return this.createInterno.execute(idEmpresa, dto.contrasena);
  }

  @Patch(':idUsuario')
  async update(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Body() dto: UpdateInternoDto,
  ) {
    await this.ensureInternoBelongsToEmpresa(idEmpresa, idUsuario);
    if (dto.contrasena === undefined) {
      throw new DomainValidationException(
        'Ingresá una contraseña para actualizar el acceso interno.',
      );
    }
    return this.updateUsuario.execute(
      idUsuario,
      new UpdateUsuarioCommand(
        undefined,
        dto.contrasena,
        Role.INTERNO,
        idEmpresa,
      ),
    );
  }

  @Delete(':idUsuario')
  async delete(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
  ) {
    await this.ensureInternoBelongsToEmpresa(idEmpresa, idUsuario);
    await this.deleteUsuario.execute(idUsuario);
  }

  private async ensureInternoBelongsToEmpresa(
    idEmpresa: number,
    idUsuario: number,
  ) {
    const usuarios = await this.findInternos.execute(idEmpresa);
    if (!usuarios.some((usuario) => usuario.id === idUsuario)) {
      throw new UsuarioNotFoundException(idUsuario);
    }
  }
}
