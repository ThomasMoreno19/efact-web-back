import { ApplicationException } from './application.exception';

export class DatabaseCompatibilityException extends ApplicationException {
  constructor() {
    super(
      'Error de compatibilidad entre el servidor y la base de datos. Aplicá las migraciones pendientes.',
      500,
    );
  }
}
