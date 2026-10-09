import { EmpresaMapper } from '../../mappers/empresa.mapper';
import { EmpresaRepository } from '../../ports/empresa.repository';

export class FindPublicEmpresaBySlugUseCase {
  constructor(private readonly repository: EmpresaRepository) {}

  async execute(slug: string) {
    const empresa = await this.repository.findBySlug(slug);
    return empresa ? EmpresaMapper.toPublicResponse(empresa) : null;
  }
}
