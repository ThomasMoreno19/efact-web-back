import { MovimientoNotFoundException } from '../../exceptions/movimiento-not-found.exception';
import { MovimientoRepository } from '../../ports/movimiento.repository';

export class DeleteMovimientoUseCase {
  constructor(private readonly repository: MovimientoRepository) {}

  async execute(idEmpresa: number, id: number): Promise<void> {
    const deleted = await this.repository.delete(idEmpresa, id);
    if (!deleted) throw new MovimientoNotFoundException(id, idEmpresa);
  }
}
