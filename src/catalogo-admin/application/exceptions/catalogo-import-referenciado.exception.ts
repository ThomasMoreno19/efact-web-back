import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class CatalogoImportReferenciadoException extends ApplicationException {
  constructor(message: string) {
    super(message, 400);
  }
}
