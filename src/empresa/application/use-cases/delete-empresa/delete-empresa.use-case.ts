import { EmpresaRepository } from '../../ports/empresa.repository';
import { EmpresaNotFoundException } from '../../exceptions/empresa-not-found.exception';

export class DeleteEmpresaUseCase {
  constructor(private readonly repository: EmpresaRepository) {}

  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new EmpresaNotFoundException(id);
    }
  }
}
