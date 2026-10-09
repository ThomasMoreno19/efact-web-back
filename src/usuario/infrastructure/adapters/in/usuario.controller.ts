import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateUsuarioUseCase } from '../../../application/use-cases/create-usuario/create-usuario.use-case';
import { DeleteUsuarioUseCase } from '../../../application/use-cases/delete-usuario/delete-usuario.use-case';
import { FindAllUsuariosUseCase } from '../../../application/use-cases/find-all-usuarios/find-all-usuarios.use-case';
import { FindUsuarioByIdUseCase } from '../../../application/use-cases/find-usuario-by-id/find-usuario-by-id.use-case';
import { UpdateUsuarioUseCase } from '../../../application/use-cases/update-usuario/update-usuario.use-case';
import { CreateUsuarioDto } from './dtos/create-usuario.dto';
import { UpdateUsuarioDto } from './dtos/update-usuario.dto';

@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly findAllUsuarios: FindAllUsuariosUseCase,
    private readonly findUsuarioById: FindUsuarioByIdUseCase,
    private readonly createUsuario: CreateUsuarioUseCase,
    private readonly updateUsuario: UpdateUsuarioUseCase,
    private readonly deleteUsuario: DeleteUsuarioUseCase,
  ) {}

  @Get()
  findAll() {
    return this.findAllUsuarios.execute();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.findUsuarioById.execute(id);
  }

  @Post()
  create(@Body() command: CreateUsuarioDto) {
    return this.createUsuario.execute(command);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() command: UpdateUsuarioDto,
  ) {
    return this.updateUsuario.execute(id, command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.deleteUsuario.execute(id);
  }
}
