import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class MovimientoNotFoundException extends ApplicationException {
  constructor(id: number, idEmpresa: number) {
    super(
      `No se encontró el movimiento ${id} para la empresa ${idEmpresa}.`,
      404,
    );
  }
}
