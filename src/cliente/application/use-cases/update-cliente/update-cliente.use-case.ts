import { PasswordHasher } from '@/shared/application/ports/password-hasher';
import { IdentificacionCliente } from '../../../domain/identificacion-cliente.value-object';
import { ClienteNotFoundException } from '../../exceptions/cliente-not-found.exception';
import { ClienteMapper } from '../../mappers/cliente.mapper';
import { ClienteRepository } from '../../ports/cliente.repository';
import { UpdateClienteCommand } from './update-cliente.command';

export class UpdateClienteUseCase {
  constructor(
    private readonly repository: ClienteRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    idEmpresa: number,
    cuil: string,
    command: UpdateClienteCommand,
  ) {
    const identificacion = IdentificacionCliente.create(cuil);
    const cliente = await this.repository.findByCuil(idEmpresa, identificacion);
    if (cliente === null) {
      throw new ClienteNotFoundException(identificacion.valor, idEmpresa);
    }

    const passwordHash =
      command.contrasena === undefined
        ? undefined
        : command.contrasena === null
          ? null
          : await this.passwordHasher.hash(command.contrasena);
    cliente.update({
      nombre: command.nombre,
      saldo: command.saldo,
      passwordHash,
      domicilio: command.domicilio,
      localidad: command.localidad,
      telefonos: command.telefonos,
    });
    const updatedCliente = await this.repository.update(
      idEmpresa,
      identificacion,
      cliente,
    );
    if (updatedCliente === null) {
      throw new ClienteNotFoundException(identificacion.valor, idEmpresa);
    }
    return ClienteMapper.toResponse(updatedCliente);
  }
}
