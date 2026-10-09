import { ClienteNotFoundException } from '../../exceptions/cliente-not-found.exception';
import { ClienteMapper } from '../../mappers/cliente.mapper';
import { ClienteRepository } from '../../ports/cliente.repository';
import { IdentificacionCliente } from '../../../domain/identificacion-cliente.value-object';

export class FindClienteByCuilUseCase {
  constructor(private readonly repository: ClienteRepository) {}

  async execute(idEmpresa: number, cuil: string) {
    const identificacion = IdentificacionCliente.create(cuil);
    const cliente = await this.repository.findByCuil(idEmpresa, identificacion);
    if (cliente === null) {
      throw new ClienteNotFoundException(identificacion.valor, idEmpresa);
    }
    return ClienteMapper.toResponse(cliente);
  }
}
