import { Cliente } from '../../../domain/cliente.entity';
import { ClienteMapper } from '../../mappers/cliente.mapper';
import { ClienteRepository } from '../../ports/cliente.repository';
import { CreateClienteCommand } from './create-cliente.command';
import { PasswordHasher } from '@/shared/application/ports/password-hasher';

export class CreateClienteUseCase {
  constructor(
    private readonly repository: ClienteRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(idEmpresa: number, command: CreateClienteCommand) {
    const passwordHash =
      command.contrasena === undefined || command.contrasena === null
        ? null
        : await this.passwordHasher.hash(command.contrasena);
    const cliente = Cliente.create({
      idEmpresa,
      cuil: command.cuil,
      nombre: command.nombre,
      saldo: command.saldo,
      passwordHash,
      domicilio: command.domicilio,
      localidad: command.localidad,
      telefonos: command.telefonos,
    });
    return ClienteMapper.toResponse(await this.repository.create(cliente));
  }
}
