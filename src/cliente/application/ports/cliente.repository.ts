import { Cliente } from '../../domain/cliente.entity';
import { IdentificacionCliente } from '../../domain/identificacion-cliente.value-object';

export const CLIENTE_REPOSITORY = Symbol('CLIENTE_REPOSITORY');

export interface ClienteRepository {
  findAll(idEmpresa: number): Promise<Cliente[]>;
  findByCuil(
    idEmpresa: number,
    cuil: IdentificacionCliente,
  ): Promise<Cliente | null>;
  create(cliente: Cliente): Promise<Cliente>;
  update(
    idEmpresa: number,
    cuil: IdentificacionCliente,
    cliente: Cliente,
  ): Promise<Cliente | null>;
  delete(idEmpresa: number, cuil: IdentificacionCliente): Promise<boolean>;
}
