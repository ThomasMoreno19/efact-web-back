import { MovimientoMapper } from '../../mappers/movimiento.mapper';
import { MovimientoRepository } from '../../ports/movimiento.repository';

export class FindAllMovimientosUseCase {
  constructor(private readonly repository: MovimientoRepository) {}

  async execute(idEmpresa: number) {
    const movimientos = await this.repository.findAll(idEmpresa);
    return movimientos.map((movimiento) =>
      MovimientoMapper.toResponse(movimiento),
    );
  }
}
