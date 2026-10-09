import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import { IdentificacionCliente } from '@/cliente/domain/identificacion-cliente.value-object';
import { ClientePasswordInvalidException } from '@/cliente/application/exceptions/cliente-password-invalid.exception';
import type { PasswordHasher } from '@/shared/application/ports/password-hasher';
import type { MovimientoRepository } from '../../ports/movimiento.repository';
import type { ConsultarReparacionesPublicasCommand } from './consultar-reparaciones-publicas.command';

export class ConsultarReparacionesPublicasUseCase {
  constructor(
    private readonly movimientoRepository: MovimientoRepository,
    private readonly empresaRepository: EmpresaRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    idEmpresa: number,
    command: ConsultarReparacionesPublicasCommand,
  ) {
    const empresa = await this.empresaRepository.findById(idEmpresa);
    if (!empresa?.configuracion.reparacionesHabilitadas) return null;

    const now = new Date();
    const seenAtCutoff = subtractCalendarMonths(now, 6);
    const movimientos =
      command.tipo === 'cuil'
        ? await this.movimientoRepository.findLatestByCuil(
            idEmpresa,
            IdentificacionCliente.create(command.valor).valor,
          )
        : await this.movimientoRepository.findLatestBySerial(
            idEmpresa,
            command.valor.trim(),
          );
    const visibles = movimientos.filter(
      ({ seenAt }) => seenAt === null || seenAt >= seenAtCutoff,
    );
    if (visibles.length === 0) return null;

    const passwordHash = visibles.find(
      ({ passwordHash }) => passwordHash,
    )?.passwordHash;
    if (passwordHash) {
      if (!command.contrasena) return { requiereContrasena: true as const };
      const isValid = await this.passwordHasher.verify(
        command.contrasena,
        passwordHash,
      );
      if (!isValid) throw new ClientePasswordInvalidException();
    }

    await this.movimientoRepository.markSeen(
      idEmpresa,
      visibles.filter(({ seenAt }) => seenAt === null).map(({ id }) => id),
      now,
    );

    return {
      requiereContrasena: false as const,
      nombreCliente:
        visibles.find(({ nombreCliente }) => nombreCliente)?.nombreCliente ??
        null,
      movimientos: visibles.map(({ equipo, estado, fecha, observacion }) => ({
        equipo,
        estado,
        fecha,
        observacion,
      })),
    };
  }
}

function subtractCalendarMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);
  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDayOfMonth));
  return result;
}
