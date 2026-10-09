export interface HorarioEmpresa {
  diaSemana: number;
  horaApertura: string;
  horaCierre: string;
}

export const HORARIO_EMPRESA_REPOSITORY = Symbol('HORARIO_EMPRESA_REPOSITORY');

export interface HorarioEmpresaRepository {
  findByEmpresaId(idEmpresa: number): Promise<HorarioEmpresa[]>;
  replaceByEmpresaId(
    idEmpresa: number,
    horarios: HorarioEmpresa[],
  ): Promise<HorarioEmpresa[]>;
}
