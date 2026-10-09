import { Usuario } from '../../domain/usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface UsuarioRepository {
  findAll(): Promise<Usuario[]>;
  findById(id: number): Promise<Usuario | null>;
  findByNombre(nombre: string): Promise<Usuario | null>;
  findInternosByEmpresa(idEmpresa: number): Promise<Usuario[]>;
  create(usuario: Usuario): Promise<Usuario>;
  update(id: number, usuario: Usuario): Promise<Usuario | null>;
  delete(id: number): Promise<boolean>;
}
