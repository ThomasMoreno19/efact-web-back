import { EmpresaNotFoundException } from '../../exceptions/empresa-not-found.exception';
import { EmpresaRepository } from '../../ports/empresa.repository';

export class GetEmpresaExcelImportTokenUseCase {
  constructor(private readonly repository: EmpresaRepository) {}

  async execute(id: number) {
    const token = await this.repository.findExcelImportToken(id);
    if (token === null) throw new EmpresaNotFoundException(id);
    return { token };
  }
}
