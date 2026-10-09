import { EmpresaMapper } from '../../mappers/empresa.mapper';
import { EmpresaRepository } from '../../ports/empresa.repository';
import { CreateEmpresaCommand } from './create-empresa.command';

export class CreateEmpresaUseCase {
  constructor(private readonly repository: EmpresaRepository) {}

  async execute(command: CreateEmpresaCommand) {
    const empresa = await this.repository.create(
      EmpresaMapper.toDomain(command),
    );
    return EmpresaMapper.toResponse(empresa);
  }
}
