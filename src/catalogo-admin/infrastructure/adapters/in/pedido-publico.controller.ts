import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';
import { CrearPedidoDto } from './dtos/crear-pedido.dto';
import { PedidoPublicoService } from '../../pedido-publico.service';

@Controller('empresas/:empresaId/pedidos')
export class PedidoPublicoController {
  constructor(private readonly pedidos: PedidoPublicoService) {}

  @Public()
  @Post()
  crear(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CrearPedidoDto,
  ) {
    return this.pedidos.crear(empresaId, dto);
  }
}
