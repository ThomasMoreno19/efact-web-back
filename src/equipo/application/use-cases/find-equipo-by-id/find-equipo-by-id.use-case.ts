import { EquipoNotFoundException } from '../../exceptions/equipo-not-found.exception';
import { EquipoMapper } from '../../mappers/equipo.mapper';
import { EquipoRepository } from '../../ports/equipo.repository';

export class FindEquipoByIdUseCase {
  constructor(private readonly repository: EquipoRepository) {}

  async execute(idEmpresa: number, id: number) {
    const equipo = await this.repository.findById(idEmpresa, id);
    if (!equipo) throw new EquipoNotFoundException(id, idEmpresa);
    return EquipoMapper.toResponse(equipo);
  }
}
