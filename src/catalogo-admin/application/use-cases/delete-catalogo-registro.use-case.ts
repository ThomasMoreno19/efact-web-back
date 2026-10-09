import type {
  CatalogoAdminRepository,
  CatalogoLista,
} from '../ports/catalogo-admin.repository';

export class DeleteCatalogoRegistroUseCase {
  constructor(private readonly repository: CatalogoAdminRepository) {}

  execute(empresaId: number, lista: CatalogoLista, id: string) {
    return this.repository.delete(empresaId, lista, id);
  }
}
