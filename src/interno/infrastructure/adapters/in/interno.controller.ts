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
import type {
  CatalogoInternoLista,
} from '../../../application/ports/interno.repository';
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
    @Query('lista') listaValue?: string,
    @Query('search') searchValue?: string,
    @Query('codigoProveedor') codigoProveedorValue?: string,
    @Query('codigoInterno') codigoInternoValue?: string,
    @Query('codigoBarra') codigoBarraValue?: string,
    @Query('marcaId') marcaIdsValue?: string | string[],
    @Query('rubroId') rubroIdsValue?: string | string[],
    @Query('proveedorId') proveedorIdsValue?: string | string[],
    @Query('ubicacionId') ubicacionIdsValue?: string | string[],
  ) {
    const page = await this.findCatalogoPage.execute(
      idEmpresa,
      parseOffset(offsetValue),
      parseLimit(limitValue),
      {
        lista: parseCatalogoLista(listaValue),
        searchWords: parseSearchWords(searchValue),
        codigoProveedor: parseCodigoProveedor(codigoProveedorValue),
        codigoInterno: parseCodigoInterno(codigoInternoValue),
        codigoBarra: parseCodigoBarra(codigoBarraValue),
        marcaIds: parseFilterIds(marcaIdsValue, 'marca'),
        rubroIds: parseFilterIds(rubroIdsValue, 'rubro'),
        proveedorIds: parseFilterIds(proveedorIdsValue, 'proveedor'),
        ubicacionIds: parseFilterIds(ubicacionIdsValue, 'ubicación'),
      },
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

function parseCatalogoLista(value?: string): CatalogoInternoLista {
  const lista = value ?? 'articulos';
  if (
    lista === 'articulos' ||
    lista === 'marcas' ||
    lista === 'rubros' ||
    lista === 'ofertas' ||
    lista === 'proveedores' ||
    lista === 'ubicaciones'
  ) {
    return lista;
  }
  throw new BadRequestException('La lista del catálogo interno no es válida.');
}

function parseSearchWords(value?: string) {
  if (value === undefined || value.trim() === '') return [];
  if (value.length > 100) {
    throw new BadRequestException('La búsqueda no puede superar 100 caracteres.');
  }
  return value.trim().split(/\s+/);
}

function parseCodigoProveedor(value?: string) {
  const codigo = value?.trim() ?? '';
  if (codigo.length > 200) {
    throw new BadRequestException('El código de proveedor no puede superar 200 caracteres.');
  }
  return codigo;
}

function parseCodigoInterno(value?: string) {
  const codigo = value?.trim() ?? '';
  if (!codigo) return undefined;
  if (!/^\d+$/.test(codigo)) {
    throw new BadRequestException('El código interno debe ser numérico.');
  }
  const parsed = Number(codigo);
  if (!Number.isInteger(parsed) || parsed > 2_147_483_647) {
    throw new BadRequestException('El código interno no es válido.');
  }
  return parsed;
}

function parseCodigoBarra(value?: string) {
  const codigo = value?.trim() ?? '';
  if (codigo.length > 20) {
    throw new BadRequestException('El código de barras no puede superar 20 caracteres.');
  }
  return codigo;
}

function parseFilterIds(value: string | string[] | undefined, label: string) {
  const values = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const parsed = values.map(Number);
  if (
    values.some(
      (id, index) =>
        !/^\d+$/.test(id) ||
        !Number.isSafeInteger(parsed[index]) ||
        parsed[index] > 2_147_483_647,
    )
  ) {
    throw new BadRequestException(`Los filtros de ${label} no son válidos.`);
  }
  return [...new Set(parsed)];
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
