import type {
  CatalogImageImportPort,
  CatalogImageManifestRecord,
} from '../ports/catalog-image-import.port';

export class ImportarImagenesCatalogoUseCase {
  constructor(private readonly imageImport: CatalogImageImportPort) {}

  parse(manifest: unknown): CatalogImageManifestRecord[] {
    return this.imageImport.parseImportImageManifest(manifest);
  }

  async execute(empresaId: number, manifest: unknown) {
    return this.executeParsed(empresaId, this.parse(manifest));
  }

  executeParsed(empresaId: number, records: CatalogImageManifestRecord[]) {
    return this.imageImport.applyImportImageManifest(empresaId, records);
  }
}
