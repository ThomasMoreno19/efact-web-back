import { Equipo } from '../../domain/equipo.entity';

export class EquipoMapper {
  static toDomain(data: {
    id: number;
    idEmpresa: number;
    marca?: string | null;
    modelo?: string | null;
    nombreEquipo?: string | null;
    createdAt?: string | null;
    nroSerie?: string | null;
    cuilCliente?: string | null;
  }): Equipo {
    return Equipo.create(data);
  }

  static toResponse(equipo: Equipo) {
    return {
      id: equipo.id,
      idEmpresa: equipo.idEmpresa,
      marca: equipo.marca,
      modelo: equipo.modelo,
      nombreEquipo: equipo.nombreEquipo,
      createdAt: equipo.createdAt,
      nroSerie: equipo.nroSerie,
      cuilCliente: equipo.cuilCliente,
    };
  }
}
