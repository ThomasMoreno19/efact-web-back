import { EquipoNotFoundException } from '../../exceptions/equipo-not-found.exception';
import { EquipoMapper } from '../../mappers/equipo.mapper';
import { EquipoRepository } from '../../ports/equipo.repository';
import { UpdateEquipoCommand } from './update-equipo.command';

export class UpdateEquipoUseCase {
  constructor(private readonly repository: EquipoRepository) {}

  async execute(idEmpresa: number, id: number, command: UpdateEquipoCommand) {
    const equipo = await this.repository.findById(idEmpresa, id);
    if (!equipo) throw new EquipoNotFoundException(id, idEmpresa);
    equipo.update(command);
    const updatedEquipo = await this.repository.update(idEmpresa, id, equipo);
    if (!updatedEquipo) throw new EquipoNotFoundException(id, idEmpresa);
    return EquipoMapper.toResponse(updatedEquipo);
  }
}
