import type {
  CatalogoAdminRepository,
  CatalogoLista,
  CatalogoRegistroActualizacion,
} from '../ports/catalogo-admin.repository';

export class UpdateCatalogoRegistroUseCase {
  constructor(private readonly repository: CatalogoAdminRepository) {}

  execute(
    empresaId: number,
    lista: CatalogoLista,
    id: string,
    data: CatalogoRegistroActualizacion,
  ) {
    return this.repository.update(empresaId, lista, id, data);
  }
}
