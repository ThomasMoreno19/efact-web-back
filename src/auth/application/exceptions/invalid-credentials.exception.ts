import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class InvalidCredentialsException extends ApplicationException {
  constructor() {
    super('El nombre o la contraseña son incorrectos.', 401);
  }
}
