import { EquipoNotFoundException } from '../../exceptions/equipo-not-found.exception';
import { EquipoRepository } from '../../ports/equipo.repository';

export class DeleteEquipoUseCase {
  constructor(private readonly repository: EquipoRepository) {}

  async execute(idEmpresa: number, id: number): Promise<void> {
    const deleted = await this.repository.delete(idEmpresa, id);
    if (!deleted) throw new EquipoNotFoundException(id, idEmpresa);
  }
}
