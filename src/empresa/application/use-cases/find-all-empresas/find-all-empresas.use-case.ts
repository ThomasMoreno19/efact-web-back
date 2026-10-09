import { EmpresaMapper } from '../../mappers/empresa.mapper';
import { EmpresaRepository } from '../../ports/empresa.repository';

export class FindAllEmpresasUseCase {
  constructor(private readonly repository: EmpresaRepository) {}

  async execute() {
    const empresas = await this.repository.findAll();
    return empresas.map((empresa) => EmpresaMapper.toResponse(empresa));
  }
}
