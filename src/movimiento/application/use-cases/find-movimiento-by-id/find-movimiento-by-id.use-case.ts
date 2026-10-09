import { MovimientoNotFoundException } from '../../exceptions/movimiento-not-found.exception';
import { MovimientoMapper } from '../../mappers/movimiento.mapper';
import { MovimientoRepository } from '../../ports/movimiento.repository';

export class FindMovimientoByIdUseCase {
  constructor(private readonly repository: MovimientoRepository) {}

  async execute(idEmpresa: number, id: number) {
    const movimiento = await this.repository.findById(idEmpresa, id);
    if (!movimiento) throw new MovimientoNotFoundException(id, idEmpresa);
    return MovimientoMapper.toResponse(movimiento);
  }
}
