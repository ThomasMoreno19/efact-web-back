import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateClienteUseCase } from '../../../application/use-cases/create-cliente/create-cliente.use-case';
import { DeleteClienteUseCase } from '../../../application/use-cases/delete-cliente/delete-cliente.use-case';
import { FindAllClientesUseCase } from '../../../application/use-cases/find-all-clientes/find-all-clientes.use-case';
import { FindClienteByCuilUseCase } from '../../../application/use-cases/find-cliente-by-cuil/find-cliente-by-cuil.use-case';
import { UpdateClienteUseCase } from '../../../application/use-cases/update-cliente/update-cliente.use-case';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';
import { ConsultarSaldoClienteUseCase } from '../../../application/use-cases/consultar-saldo-cliente/consultar-saldo-cliente.use-case';
import { ConsultarSaldoClienteDto } from './dtos/consultar-saldo-cliente.dto';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';

@Controller(':idEmpresa/clientes')
export class ClienteController {
  constructor(
    private readonly findAllClientes: FindAllClientesUseCase,
    private readonly findClienteByCuil: FindClienteByCuilUseCase,
    private readonly createCliente: CreateClienteUseCase,
    private readonly updateCliente: UpdateClienteUseCase,
    private readonly deleteCliente: DeleteClienteUseCase,
    private readonly consultarSaldoCliente: ConsultarSaldoClienteUseCase,
  ) {}

  @Get()
  findAll(@Param('idEmpresa', ParseIntPipe) idEmpresa: number) {
    return this.findAllClientes.execute(idEmpresa);
  }

  @Get('saldos')
  async findAllSaldos(@Param('idEmpresa', ParseIntPipe) idEmpresa: number) {
    const clientes = await this.findAllClientes.execute(idEmpresa);
    return clientes.map(({ nombre, saldo, updatedAt }) => ({
      nombre,
      saldo,
      updatedAt,
    }));
  }

  @Public()
  @Post('saldo')
  async consultarSaldo(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Body() dto: ConsultarSaldoClienteDto,
  ) {
    const resultado = await this.consultarSaldoCliente.execute(
      idEmpresa,
      dto.cuil,
      dto.contrasena,
    );
    if (!resultado) {
      throw new NotFoundException('No se encontró un cliente con esos datos.');
    }
    return resultado;
  }

  @Get(':cuil')
  findByCuil(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('cuil') cuil: string,
  ) {
    return this.findClienteByCuil.execute(idEmpresa, cuil);
  }

  @Post()
  create(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Body() dto: CreateClienteDto,
  ) {
    return this.createCliente.execute(idEmpresa, dto);
  }

  @Patch(':cuil')
  update(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('cuil') cuil: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.updateCliente.execute(idEmpresa, cuil, dto);
  }

  @Delete(':cuil')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Param('cuil') cuil: string,
  ) {
    return this.deleteCliente.execute(idEmpresa, cuil);
  }
}
