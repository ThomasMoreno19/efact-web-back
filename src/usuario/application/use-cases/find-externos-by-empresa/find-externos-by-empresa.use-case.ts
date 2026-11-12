import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import { EmpresaNotFoundException } from '@/empresa/application/exceptions/empresa-not-found.exception';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { UsuarioRepository } from '../../ports/usuario.repository';

export class FindExternosByEmpresaUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly empresas: EmpresaRepository,
  ) {}

  async execute(idEmpresa: number) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa) throw new EmpresaNotFoundException(idEmpresa);
    return (await this.usuarios.findExternosByEmpresa(idEmpresa)).map(
      UsuarioMapper.toResponse,
    );
  }
}
