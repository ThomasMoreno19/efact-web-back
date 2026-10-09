import { Role } from '../../../domain/role.enum';

export class UpdateUsuarioCommand {
  constructor(
    readonly nombre?: string,
    readonly contrasena?: string,
    readonly role?: Role,
    readonly id_empresa?: number | null,
  ) {}
}
