import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import type {
  CatalogoInternoFiltros,
  InternoRepository,
} from '../ports/interno.repository';

export class FindCatalogoInternoPageUseCase {
  constructor(
    private readonly repository: InternoRepository,
    private readonly empresas: EmpresaRepository,
  ) {}

  async execute(
    idEmpresa: number,
    offset: number,
    limit: number,
    filters: CatalogoInternoFiltros,
  ) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa?.configuracion.catalogoHabilitado) return null;

    const page = await this.repository.findCatalogoPage(
      idEmpresa,
      offset,
      limit,
      filters,
    );
    return {
      ...page,
      hasMore: offset + page.records.length < page.total,
    };
  }
}
