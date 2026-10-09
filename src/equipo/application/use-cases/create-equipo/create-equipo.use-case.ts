import { EquipoMapper } from '../../mappers/equipo.mapper';
import { EquipoRepository } from '../../ports/equipo.repository';
import { CreateEquipoCommand } from './create-equipo.command';

export class CreateEquipoUseCase {
  constructor(private readonly repository: EquipoRepository) {}

  async execute(idEmpresa: number, command: CreateEquipoCommand) {
    const equipo = await this.repository.create(
      EquipoMapper.toDomain({ ...command, idEmpresa }),
    );
    return EquipoMapper.toResponse(equipo);
  }
}
