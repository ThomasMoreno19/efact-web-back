import type {
  CatalogoAdminRepository,
  CatalogoBusquedaPublica,
  CatalogoLista,
} from '../ports/catalogo-admin.repository';

export class FindCatalogoListaUseCase {
  constructor(private readonly repository: CatalogoAdminRepository) {}

  execute(
    empresaId: number,
    lista: CatalogoLista,
    searchWords: string[],
    offset: number,
    limit: number,
    filters?: CatalogoBusquedaPublica,
  ) {
    return this.repository.findAll(
      empresaId,
      lista,
      searchWords,
      offset,
      limit,
      filters,
    );
  }
}
