import { EmpresaNotFoundException } from '../../exceptions/empresa-not-found.exception';
import type { EmpresaRepository } from '../../ports/empresa.repository';
import type { HorarioEmpresaRepository } from '../../ports/horario-empresa.repository';

export class FindHorariosEmpresaUseCase {
  constructor(
    private readonly empresas: EmpresaRepository,
    private readonly horarios: HorarioEmpresaRepository,
  ) {}

  async execute(idEmpresa: number) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa) throw new EmpresaNotFoundException(idEmpresa);
    return this.horarios.findByEmpresaId(idEmpresa);
  }
}
