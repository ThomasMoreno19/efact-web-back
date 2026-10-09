import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateInternoUseCase } from '../../../application/use-cases/create-interno/create-interno.use-case';
import { FindInternosByEmpresaUseCase } from '../../../application/use-cases/find-internos-by-empresa/find-internos-by-empresa.use-case';
import { CreateInternoDto } from './dtos/create-interno.dto';

@Controller('empresas/:idEmpresa/usuarios-internos')
export class UsuarioInternoController {
  constructor(
    private readonly findInternos: FindInternosByEmpresaUseCase,
    private readonly createInterno: CreateInternoUseCase,
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
    return this.createInterno.execute(idEmpresa, dto.nombre, dto.contrasena);
  }
}
