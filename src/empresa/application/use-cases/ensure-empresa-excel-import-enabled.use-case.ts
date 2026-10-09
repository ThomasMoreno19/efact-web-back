import { EmpresaExcelImportDisabledException } from '../exceptions/empresa-excel-import-disabled.exception';
import { EmpresaNotFoundException } from '../exceptions/empresa-not-found.exception';
import type { EmpresaRepository } from '../ports/empresa.repository';

export class EnsureEmpresaExcelImportEnabledUseCase {
  constructor(private readonly repository: EmpresaRepository) {}

  async execute(empresaId: number): Promise<void> {
    const enabled = await this.repository.findExcelImportEnabled(empresaId);
    if (enabled === null) throw new EmpresaNotFoundException(empresaId);
    if (!enabled) throw new EmpresaExcelImportDisabledException();
  }
}
