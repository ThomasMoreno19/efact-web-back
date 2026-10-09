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
import { CreateEquipoUseCase } from '../../../application/use-cases/create-equipo/create-equipo.use-case';
import { DeleteEquipoUseCase } from '../../../application/use-cases/delete-equipo/delete-equipo.use-case';
import { FindAllEquiposUseCase } from '../../../application/use-cases/find-all-equipos/find-all-equipos.use-case';
import { FindEquipoByIdUseCase } from '../../../application/use-cases/find-equipo-by-id/find-equipo-by-id.use-case';
import { UpdateEquipoUseCase } from '../../../application/use-cases/update-equipo/update-equipo.use-case';
import { CreateEquipoDto } from './dtos/create-equipo.dto';
import { UpdateEquipoDto } from './dtos/update-equipo.dto';

@Controller(':idEmpresa/equipos')
export class EquipoController {
  constructor(
    private readonly findAllEquipos: FindAllEquiposUseCase,
    private readonly findEquipoById: FindEquipoByIdUseCase,
    private readonly createEquipo: CreateEquipoUseCase,
    private readonly updateEquipo: UpdateEquipoUseCase,
    private readonly deleteEquipo: DeleteEquipoUseCase,
  ) {}

  @Get()
  findAll(@Param('idEmpresa', ParseIntPipe) idEmpresa: number) {
    return this.findAllEquipos.execute(idEmpresa);
  }

  @Get(':id')
  findById(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.findEquipoById.execute(idEmpresa, id);
  }

  @Post()
  create(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Body() dto: CreateEquipoDto,
  ) {
    return this.createEquipo.execute(idEmpresa, dto);
  }

  @Patch(':id')
  update(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipoDto,
  ) {
    return this.updateEquipo.execute(idEmpresa, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deleteEquipo.execute(idEmpresa, id);
  }
}
