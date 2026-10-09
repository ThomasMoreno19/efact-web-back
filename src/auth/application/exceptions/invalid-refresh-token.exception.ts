import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class InvalidRefreshTokenException extends ApplicationException {
  constructor() {
    super('El token de actualización no es válido o expiró.', 401);
  }
}
