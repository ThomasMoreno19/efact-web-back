import type { EmpresaRepository } from '@/empresa/application/ports/empresa.repository';
import { EmpresaNotFoundException } from '@/empresa/application/exceptions/empresa-not-found.exception';
import type { UsuarioRepository } from '../../ports/usuario.repository';
import { UsuarioMapper } from '../../mappers/usuario.mapper';

export class FindInternosByEmpresaUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly empresas: EmpresaRepository,
  ) {}

  async execute(idEmpresa: number) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa) throw new EmpresaNotFoundException(idEmpresa);
    const usuarios = await this.usuarios.findInternosByEmpresa(idEmpresa);
    return usuarios.map((usuario) => UsuarioMapper.toResponse(usuario));
  }
}
