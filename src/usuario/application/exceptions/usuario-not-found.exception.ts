import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class UsuarioNotFoundException extends ApplicationException {
  constructor(id: number) {
    super(`No se encontró el usuario con id '${id}'.`, 404);
  }
}
