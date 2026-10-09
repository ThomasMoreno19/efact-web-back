import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import { LogoutCommand } from '@/auth/application/use-cases/logout/logout.command';
import { LogoutUseCase } from '@/auth/application/use-cases/logout/logout.use-case';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';
import { FindCatalogoInternoPageUseCase } from '../../../application/use-cases/find-catalogo-interno-page.use-case';
import { FindSaldosInternosUseCase } from '../../../application/use-cases/find-saldos-internos.use-case';
import {
  InternoAuthGuard,
  type InternalRequest,
} from './guards/interno-auth.guard';

@Controller('empresas/:idEmpresa/interno')
@Public()
@UseGuards(InternoAuthGuard)
export class InternoController {
  constructor(
    private readonly findCatalogoPage: FindCatalogoInternoPageUseCase,
    private readonly findSaldos: FindSaldosInternosUseCase,
    private readonly logout: LogoutUseCase,
  ) {}

  @Get('session')
  getSession(@Req() request: InternalRequest) {
    return { ...request.interno, role: 'Interno' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutInterno(@Req() request: InternalRequest) {
    await this.logout.execute(new LogoutCommand(request.interno.id));
  }

  @Get('catalogo')
  async getCatalogo(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Query('offset') offsetValue?: string,
    @Query('limit') limitValue?: string,
  ) {
    const page = await this.findCatalogoPage.execute(
      idEmpresa,
      parseOffset(offsetValue),
      parseLimit(limitValue),
    );
    if (!page) throw new NotFoundException();
    return page;
  }

  @Get('saldos')
  async getSaldos(@Param('idEmpresa', ParseIntPipe) idEmpresa: number) {
    const saldos = await this.findSaldos.execute(idEmpresa);
    if (!saldos) throw new NotFoundException();
    return saldos;
  }
}

function parseOffset(value?: string) {
  if (value === undefined) return 0;
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException('El desplazamiento no es válido.');
  }
  const offset = Number(value);
  if (!Number.isSafeInteger(offset)) {
    throw new BadRequestException('El desplazamiento no es válido.');
  }
  return offset;
}

function parseLimit(value?: string) {
  if (value === undefined) return 30;
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException('La cantidad de registros no es válida.');
  }
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('La cantidad de registros no es válida.');
  }
  return limit;
}
