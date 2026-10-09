import type { MovimientoRepository } from '../../ports/movimiento.repository';

export class FindMovimientosPageUseCase {
  constructor(private readonly repository: MovimientoRepository) {}

  async execute(idEmpresa: number, offset: number, limit: number) {
    const page = await this.repository.findPage(idEmpresa, offset, limit);
    return {
      ...page,
      hasMore: offset + page.records.length < page.total,
    };
  }
}
