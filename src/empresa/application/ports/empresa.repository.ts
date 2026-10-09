import { Empresa } from '../../domain/empresa.entity';

export const EMPRESA_REPOSITORY = Symbol('EMPRESA_REPOSITORY');

export interface EmpresaRepository {
  findAll(): Promise<Empresa[]>;
  findById(id: number): Promise<Empresa | null>;
  findBySlug(slug: string): Promise<Empresa | null>;
  findExcelImportToken(id: number): Promise<string | null>;
  findExcelImportEnabled(id: number): Promise<boolean | null>;
  create(empresa: Empresa): Promise<Empresa>;
  update(id: number, empresa: Empresa): Promise<Empresa | null>;
  delete(id: number): Promise<boolean>;
}
