import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateMovimientoUseCase } from '../../../application/use-cases/create-movimiento/create-movimiento.use-case';
import { DeleteMovimientoUseCase } from '../../../application/use-cases/delete-movimiento/delete-movimiento.use-case';
import { FindAllMovimientosUseCase } from '../../../application/use-cases/find-all-movimientos/find-all-movimientos.use-case';
import { FindMovimientoByIdUseCase } from '../../../application/use-cases/find-movimiento-by-id/find-movimiento-by-id.use-case';
import { UpdateMovimientoUseCase } from '../../../application/use-cases/update-movimiento/update-movimiento.use-case';
import { FindMovimientosPageUseCase } from '../../../application/use-cases/find-movimientos-page/find-movimientos-page.use-case';
import { CreateMovimientoDto } from './dtos/create-movimiento.dto';
import { UpdateMovimientoDto } from './dtos/update-movimiento.dto';

@Controller(':idEmpresa/movimientos')
export class MovimientoController {
  constructor(
    private readonly findAllMovimientos: FindAllMovimientosUseCase,
    private readonly findMovimientosPage: FindMovimientosPageUseCase,
    private readonly findMovimientoById: FindMovimientoByIdUseCase,
    private readonly createMovimiento: CreateMovimientoUseCase,
    private readonly updateMovimiento: UpdateMovimientoUseCase,
    private readonly deleteMovimiento: DeleteMovimientoUseCase,
  ) {}

  @Get()
  findAll(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Query('offset') offsetValue?: string,
    @Query('limit') limitValue?: string,
  ) {
    if (offsetValue !== undefined || limitValue !== undefined) {
      const offset = parseOffset(offsetValue);
      const limit = parseLimit(limitValue);
      return this.findMovimientosPage.execute(idEmpresa, offset, limit);
    }
    return this.findAllMovimientos.execute(idEmpresa);
  }

  @Get(':id')
  findById(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.findMovimientoById.execute(idEmpresa, id);
  }

  @Post()
  create(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Body() dto: CreateMovimientoDto,
  ) {
    return this.createMovimiento.execute(idEmpresa, dto);
  }

  @Patch(':id')
  update(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovimientoDto,
  ) {
    return this.updateMovimiento.execute(idEmpresa, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deleteMovimiento.execute(idEmpresa, id);
  }
}

function parseOffset(value?: string) {
  if (value === undefined) return 0;
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(
      'El desplazamiento de movimientos no es válido.',
    );
  }
  const offset = Number(value);
  if (!Number.isSafeInteger(offset)) {
    throw new BadRequestException(
      'El desplazamiento de movimientos no es válido.',
    );
  }
  return offset;
}

function parseLimit(value?: string) {
  if (value === undefined) return 30;
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(
      'La cantidad de movimientos solicitada no es válida.',
    );
  }
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException(
      'La cantidad de movimientos solicitada no es válida.',
    );
  }
  return limit;
}
