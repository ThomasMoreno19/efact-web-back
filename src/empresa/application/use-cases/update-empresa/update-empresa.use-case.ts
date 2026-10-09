import { EmpresaNotFoundException } from '../../exceptions/empresa-not-found.exception';
import { EmpresaMapper } from '../../mappers/empresa.mapper';
import { EmpresaRepository } from '../../ports/empresa.repository';
import { UpdateEmpresaCommand } from './update-empresa.command';

export class UpdateEmpresaUseCase {
  constructor(private readonly repository: EmpresaRepository) {}

  async execute(id: number, command: UpdateEmpresaCommand) {
    const empresa = await this.repository.findById(id);
    if (empresa === null) {
      throw new EmpresaNotFoundException(id);
    }

    EmpresaMapper.applyUpdate(empresa, command);
    const updatedEmpresa = await this.repository.update(id, empresa);
    if (updatedEmpresa === null) {
      throw new EmpresaNotFoundException(id);
    }
    return EmpresaMapper.toResponse(updatedEmpresa);
  }
}
