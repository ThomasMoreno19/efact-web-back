import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export interface ClienteImportIssue {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

export class ClienteImportValidationException extends ApplicationException {
  constructor(public readonly errors: ClienteImportIssue[]) {
    super('El Excel tiene errores de formato o de datos.', 400);
  }
}
