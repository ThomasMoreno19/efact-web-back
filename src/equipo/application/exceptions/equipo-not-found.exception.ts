import { ApplicationException } from '@/shared/application/exceptions/application.exception';

export class EquipoNotFoundException extends ApplicationException {
  constructor(id: number, idEmpresa: number) {
    super(`No se encontró el equipo ${id} para la empresa ${idEmpresa}.`, 404);
  }
}
