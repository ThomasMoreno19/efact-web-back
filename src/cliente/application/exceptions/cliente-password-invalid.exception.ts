import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class ClientePasswordInvalidException extends ApplicationException {
  constructor() {
    super('La contraseña ingresada no es correcta.', 401);
  }
}
