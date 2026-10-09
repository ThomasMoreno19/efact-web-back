import { ClienteNotFoundException } from '../../exceptions/cliente-not-found.exception';
import { ClienteRepository } from '../../ports/cliente.repository';
import { IdentificacionCliente } from '../../../domain/identificacion-cliente.value-object';

export class DeleteClienteUseCase {
  constructor(private readonly repository: ClienteRepository) {}

  async execute(idEmpresa: number, cuil: string): Promise<void> {
    const identificacion = IdentificacionCliente.create(cuil);
    const deleted = await this.repository.delete(idEmpresa, identificacion);
    if (!deleted) {
      throw new ClienteNotFoundException(identificacion.valor, idEmpresa);
    }
  }
}
