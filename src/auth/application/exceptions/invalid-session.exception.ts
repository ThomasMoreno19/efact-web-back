import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class InvalidSessionException extends ApplicationException {
  constructor() {
    super('La sesión no es válida.', 401);
  }
}
