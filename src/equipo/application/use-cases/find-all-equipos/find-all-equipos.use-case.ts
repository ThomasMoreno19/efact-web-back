import { EquipoMapper } from '../../mappers/equipo.mapper';
import { EquipoRepository } from '../../ports/equipo.repository';

export class FindAllEquiposUseCase {
  constructor(private readonly repository: EquipoRepository) {}

  async execute(idEmpresa: number) {
    const equipos = await this.repository.findAll(idEmpresa);
    return equipos.map((equipo) => EquipoMapper.toResponse(equipo));
  }
}
