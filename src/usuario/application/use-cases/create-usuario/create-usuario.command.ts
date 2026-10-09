import { Role } from '../../../domain/role.enum';

export class CreateUsuarioCommand {
  constructor(
    readonly nombre: string,
    readonly contrasena: string,
    readonly role?: Role,
    readonly id_empresa?: number | null,
  ) {}
}
