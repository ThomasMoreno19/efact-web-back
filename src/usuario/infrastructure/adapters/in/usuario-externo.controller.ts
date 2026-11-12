import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';
import { CreateExternoUseCase } from '../../../application/use-cases/create-externo/create-externo.use-case';
import { FindExternosByEmpresaUseCase } from '../../../application/use-cases/find-externos-by-empresa/find-externos-by-empresa.use-case';
import { UpdateUsuarioUseCase } from '../../../application/use-cases/update-usuario/update-usuario.use-case';
import { DeleteUsuarioUseCase } from '../../../application/use-cases/delete-usuario/delete-usuario.use-case';
import { UpdateUsuarioCommand } from '../../../application/use-cases/update-usuario/update-usuario.command';
import { CreateExternoDto } from './dtos/create-externo.dto';
import { UpdateExternoDto } from './dtos/update-externo.dto';
import { Role } from '../../../domain/role.enum';
import { UsuarioNotFoundException } from '../../../application/exceptions/usuario-not-found.exception';

@Controller('empresas/:idEmpresa/usuarios-externos')
export class UsuarioExternoController {
  constructor(
    private readonly findExternos: FindExternosByEmpresaUseCase,
    private readonly createExterno: CreateExternoUseCase,
    private readonly updateUsuario: UpdateUsuarioUseCase,
    private readonly deleteUsuario: DeleteUsuarioUseCase,
  ) {}

  @Get()
  findAll(@Param('idEmpresa', ParseIntPipe) idEmpresa: number) {
    return this.findExternos.execute(idEmpresa);
  }

  @Public()
  @Get('habilitado')
  async isEnabled(@Param('idEmpresa', ParseIntPipe) idEmpresa: number) {
    return { requiereAutenticacion: (await this.findExternos.execute(idEmpresa)).length > 0 };
  }

  @Post()
  create(@Param('idEmpresa', ParseIntPipe) idEmpresa: number, @Body() dto: CreateExternoDto) {
    return this.createExterno.execute(idEmpresa, dto.contrasena);
  }

  @Patch(':idUsuario')
  async update(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Body() dto: UpdateExternoDto,
  ) {
    await this.ensureExternoBelongsToEmpresa(idEmpresa, idUsuario);
    return this.updateUsuario.execute(
      idUsuario,
      new UpdateUsuarioCommand(undefined, dto.contrasena, Role.EXTERNO, idEmpresa),
    );
  }

  @Delete(':idUsuario')
  async delete(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
  ) {
    await this.ensureExternoBelongsToEmpresa(idEmpresa, idUsuario);
    await this.deleteUsuario.execute(idUsuario);
  }

  private async ensureExternoBelongsToEmpresa(idEmpresa: number, idUsuario: number) {
    const usuarios = await this.findExternos.execute(idEmpresa);
    if (!usuarios.some((usuario) => usuario.id === idUsuario)) {
      throw new UsuarioNotFoundException(idUsuario);
    }
  }
}
