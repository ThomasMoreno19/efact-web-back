import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class EmpresaExcelImportDisabledException extends ApplicationException {
  constructor() {
    super('Las cargas de Excel están deshabilitadas para esta empresa.', 403);
  }
}
