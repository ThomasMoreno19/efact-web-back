import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class ClienteNotFoundException extends ApplicationException {
  constructor(cuil: string, idEmpresa: number) {
    super(
      `No se encontró el cliente con identificación '${cuil}' para la empresa '${idEmpresa}'.`,
      404,
    );
  }
}
