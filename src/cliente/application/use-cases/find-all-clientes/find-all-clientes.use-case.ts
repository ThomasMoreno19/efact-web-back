import { ClienteMapper } from '../../mappers/cliente.mapper';
import { ClienteRepository } from '../../ports/cliente.repository';

export class FindAllClientesUseCase {
  constructor(private readonly repository: ClienteRepository) {}

  async execute(idEmpresa: number) {
    const clientes = await this.repository.findAll(idEmpresa);
    return clientes.map((cliente) => ClienteMapper.toResponse(cliente));
  }
}
