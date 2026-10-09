import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import { PasswordHasher } from '@/shared/application/ports/password-hasher';
import { ClientePasswordInvalidException } from '../../exceptions/cliente-password-invalid.exception';
import { ClienteRepository } from '../../ports/cliente.repository';
import { IdentificacionCliente } from '../../../domain/identificacion-cliente.value-object';

export class ConsultarSaldoClienteUseCase {
  constructor(
    private readonly repository: ClienteRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly empresaRepository: EmpresaRepository,
  ) {}

  async execute(idEmpresa: number, cuil: string, contrasena?: string) {
    const empresa = await this.empresaRepository.findById(idEmpresa);
    if (!empresa?.configuracion.saldosHabilitados) return null;

    const identificacion = IdentificacionCliente.create(cuil);
    const cliente = await this.repository.findByCuil(idEmpresa, identificacion);
    if (!cliente) return null;

    if (cliente.passwordHash) {
      if (!contrasena) return { requiereContrasena: true } as const;
      const passwordIsValid = await this.passwordHasher.verify(
        contrasena,
        cliente.passwordHash,
      );
      if (!passwordIsValid) throw new ClientePasswordInvalidException();
    }

    return {
      requiereContrasena: false as const,
      nombre: cliente.nombre,
      saldo: cliente.saldo,
      updatedAt: cliente.updatedAt,
    };
  }
}
