import { MovimientoMapper } from '../../mappers/movimiento.mapper';
import { MovimientoRepository } from '../../ports/movimiento.repository';
import { CreateMovimientoCommand } from './create-movimiento.command';

export class CreateMovimientoUseCase {
  constructor(private readonly repository: MovimientoRepository) {}

  async execute(idEmpresa: number, command: CreateMovimientoCommand) {
    const movimiento = MovimientoMapper.toDomain({
      ...command,
      idEmpresa,
    });
    return MovimientoMapper.toResponse(
      await this.repository.create(movimiento),
    );
  }
}
