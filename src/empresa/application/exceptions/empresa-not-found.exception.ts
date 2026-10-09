import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class EmpresaNotFoundException extends ApplicationException {
  constructor(id: number) {
    super(`No se encontró la empresa con id '${id}'.`, 404);
  }
}
