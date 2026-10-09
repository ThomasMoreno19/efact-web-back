import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class MovimientoImportIdExistenteException extends ApplicationException {
  constructor() {
    super('Uno o más IdMovimiento ya pertenecen a otra empresa.', 400);
  }
}
