import { Equipo } from '../../domain/equipo.entity';

export const EQUIPO_REPOSITORY = Symbol('EQUIPO_REPOSITORY');

export interface EquipoRepository {
  findAll(idEmpresa: number): Promise<Equipo[]>;
  findById(idEmpresa: number, id: number): Promise<Equipo | null>;
  create(equipo: Equipo): Promise<Equipo>;
  update(idEmpresa: number, id: number, equipo: Equipo): Promise<Equipo | null>;
  delete(idEmpresa: number, id: number): Promise<boolean>;
}
