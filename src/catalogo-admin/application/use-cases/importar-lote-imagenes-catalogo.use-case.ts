import type {
  CatalogImageImportPort,
  CatalogImageUpload,
} from '../ports/catalog-image-import.port';

export class ImportarLoteImagenesCatalogoUseCase {
  constructor(private readonly imageImport: CatalogImageImportPort) {}

  execute(
    empresaId: number,
    records: unknown,
    files: CatalogImageUpload[] | undefined,
  ) {
    return this.imageImport.applyImageBatch(empresaId, records, files);
  }
}
