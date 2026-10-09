import { MovimientoNotFoundException } from '../../exceptions/movimiento-not-found.exception';
import { MovimientoMapper } from '../../mappers/movimiento.mapper';
import { MovimientoRepository } from '../../ports/movimiento.repository';
import { UpdateMovimientoCommand } from './update-movimiento.command';

export class UpdateMovimientoUseCase {
  constructor(private readonly repository: MovimientoRepository) {}

  async execute(
    idEmpresa: number,
    id: number,
    command: UpdateMovimientoCommand,
  ) {
    const movimiento = await this.repository.findById(idEmpresa, id);
    if (!movimiento) throw new MovimientoNotFoundException(id, idEmpresa);

    movimiento.update({
      idEquipo: command.idEquipo,
      estado: command.estado,
      fecha: command.fecha,
      observacion: command.observacion,
    });

    const updated = await this.repository.update(idEmpresa, id, movimiento);
    if (!updated) throw new MovimientoNotFoundException(id, idEmpresa);
    return MovimientoMapper.toResponse(updated);
  }
}
