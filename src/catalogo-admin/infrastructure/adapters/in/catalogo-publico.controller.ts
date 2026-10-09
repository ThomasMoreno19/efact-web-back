import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';
import {
  EMPRESA_REPOSITORY,
  type EmpresaRepository,
} from '@/empresa/application/ports/empresa.repository';
import { CatalogoLista } from '../../../application/ports/catalogo-admin.repository';
import { FindCatalogoListaUseCase } from '../../../application/use-cases/find-catalogo-lista.use-case';

const CatalogoListaPublica = {
  ARTICULOS: 'articulos',
  MARCAS: 'marcas',
  RUBROS: 'rubros',
  OFERTAS: 'ofertas',
} as const;

type CatalogoListaPublica =
  (typeof CatalogoListaPublica)[keyof typeof CatalogoListaPublica];

@Controller('empresas/:empresaId/catalogo-publico')
export class CatalogoPublicoController {
  constructor(
    private readonly findCatalogoLista: FindCatalogoListaUseCase,
    @Inject(EMPRESA_REPOSITORY)
    private readonly empresas: EmpresaRepository,
  ) {}

  @Public()
  @Get(':lista')
  @Header('Cache-Control', 'no-store')
  async findAll(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('lista', new ParseEnumPipe(CatalogoListaPublica))
    lista: CatalogoListaPublica,
    @Query('offset') offsetValue?: string,
    @Query('search') searchValue?: string,
    @Query('codigoProveedor') codigoProveedorValue?: string,
    @Query('codigoInterno') codigoInternoValue?: string,
    @Query('articuloId') articuloIdValue?: string | string[],
    @Query('marcaId') marcaIdValue?: string | string[],
    @Query('rubroId') rubroIdValue?: string | string[],
  ) {
    const empresa = await this.empresas.findById(empresaId);
    if (!empresa || !empresa.configuracion.catalogoHabilitado) {
      throw new NotFoundException();
    }

    const offset = parseOffset(offsetValue);
    const searchWords = parseSearchWords(searchValue);
    const codigoProveedor = parseCodigoProveedor(codigoProveedorValue);
    const codigoInterno = parseCodigoInterno(codigoInternoValue);
    const articuloIds = parseArticleIds(articuloIdValue);
    if (articuloIds.length > 0 && lista !== 'articulos') {
      throw new BadRequestException(
        'Los identificadores de artículos solo se pueden usar en la lista de artículos.',
      );
    }
    const marcaIds = parseFilterIds(marcaIdValue, 'marca');
    const rubroIds = parseFilterIds(rubroIdValue, 'rubro');
    const isArticles = lista === 'articulos' || lista === 'ofertas';
    const resource = getCatalogoResource(lista);

    return this.findCatalogoLista.execute(
      empresaId,
      resource,
      searchWords,
      offset,
      articuloIds.length > 0 ? articuloIds.length : 30,
      {
        ...(isArticles && codigoProveedor ? { codigoProveedor } : {}),
        ...(isArticles && codigoInterno !== undefined ? { codigoInterno } : {}),
        ...(articuloIds.length > 0 ? { articuloIds } : {}),
        ...(isArticles && marcaIds.length > 0 ? { marcaIds } : {}),
        ...(isArticles && rubroIds.length > 0 ? { rubroIds } : {}),
        ...(lista === 'ofertas' ? { soloOfertas: true } : {}),
      },
    );
  }
}

function getCatalogoResource(lista: CatalogoListaPublica) {
  switch (lista) {
    case 'articulos':
    case 'ofertas':
      return CatalogoLista.ARTICULOS;
    case 'marcas':
      return CatalogoLista.MARCAS;
    case 'rubros':
      return CatalogoLista.RUBROS;
  }
}

function parseOffset(value?: string) {
  if (value === undefined) return 0;
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(
      'El desplazamiento de la lista no es válido.',
    );
  }
  const offset = Number(value);
  if (!Number.isSafeInteger(offset)) {
    throw new BadRequestException(
      'El desplazamiento de la lista no es válido.',
    );
  }
  return offset;
}

function parseSearchWords(value?: string) {
  if (value === undefined || value.trim() === '') return [];
  if (value.length > 100) {
    throw new BadRequestException(
      'La búsqueda no puede superar 100 caracteres.',
    );
  }
  return value.trim().split(/\s+/);
}

function parseCodigoProveedor(value?: string) {
  const codigo = value?.trim() ?? '';
  if (codigo.length > 200) {
    throw new BadRequestException(
      'El código de proveedor no puede superar 200 caracteres.',
    );
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

function parseFilterIds(value: string | string[] | undefined, label: string) {
  const values =
    value === undefined ? [] : Array.isArray(value) ? value : [value];
  const parsed = values.map((id) => Number(id));
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

function parseArticleIds(value: string | string[] | undefined) {
  const values =
    value === undefined ? [] : Array.isArray(value) ? value : [value];
  const ids = values.map((id) => {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(
        'Los identificadores de artículos no son válidos.',
      );
    }
    const parsed = BigInt(id);
    if (parsed <= 0n || parsed > 9_223_372_036_854_775_807n) {
      throw new BadRequestException(
        'Los identificadores de artículos no son válidos.',
      );
    }
    return parsed;
  });
  return [...new Set(ids.map(String))].map((id) => BigInt(id));
}
