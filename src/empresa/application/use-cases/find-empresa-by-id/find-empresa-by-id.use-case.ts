import { EmpresaNotFoundException } from '../../exceptions/empresa-not-found.exception';
import { EmpresaMapper } from '../../mappers/empresa.mapper';
import { EmpresaRepository } from '../../ports/empresa.repository';

export class FindEmpresaByIdUseCase {
  constructor(private readonly repository: EmpresaRepository) {}

  async execute(id: number) {
    const empresa = await this.repository.findById(id);
    if (empresa === null) {
      throw new EmpresaNotFoundException(id);
    }
    return EmpresaMapper.toResponse(empresa);
  }
}
