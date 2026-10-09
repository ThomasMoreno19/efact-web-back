import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import type { InternoRepository } from '../ports/interno.repository';

export class FindSaldosInternosUseCase {
  constructor(
    private readonly repository: InternoRepository,
    private readonly empresas: EmpresaRepository,
  ) {}

  async execute(idEmpresa: number) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa?.configuracion.saldosHabilitados) return null;
    return this.repository.findSaldos(idEmpresa);
  }
}
