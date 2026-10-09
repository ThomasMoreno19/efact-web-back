import {
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';
import { ConsultarReparacionesPublicasUseCase } from '../../../application/use-cases/consultar-reparaciones-publicas/consultar-reparaciones-publicas.use-case';
import { ConsultarReparacionesPublicasDto } from './dtos/consultar-reparaciones-publicas.dto';

@Controller(':idEmpresa/reparaciones')
export class ReparacionesPublicasController {
  constructor(
    private readonly consultarReparaciones: ConsultarReparacionesPublicasUseCase,
  ) {}

  @Public()
  @Post('consulta')
  async consultar(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Body() dto: ConsultarReparacionesPublicasDto,
  ) {
    const resultado = await this.consultarReparaciones.execute(idEmpresa, dto);
    if (!resultado) {
      throw new NotFoundException(
        'No encontramos movimientos vigentes para esos datos.',
      );
    }
    return resultado;
  }
}
