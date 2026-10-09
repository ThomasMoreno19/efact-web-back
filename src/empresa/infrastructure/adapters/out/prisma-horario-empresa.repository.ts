import { Injectable } from '@nestjs/common';
import type { Horario as PrismaHorario } from '@prisma/client';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import type {
  HorarioEmpresa,
  HorarioEmpresaRepository,
} from '../../../application/ports/horario-empresa.repository';

@Injectable()
export class PrismaHorarioEmpresaRepository implements HorarioEmpresaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmpresaId(idEmpresa: number): Promise<HorarioEmpresa[]> {
    const horarios = await this.prisma.horario.findMany({
      where: { id_empresa: idEmpresa },
      orderBy: [{ dia_semana: 'asc' }, { hora_apertura: 'asc' }],
    });
    return horarios.map(toDomain);
  }

  async replaceByEmpresaId(
    idEmpresa: number,
    horarios: HorarioEmpresa[],
  ): Promise<HorarioEmpresa[]> {
    const updatedHorarios = await this.prisma.$transaction(
      async (transaction) => {
        await transaction.horario.deleteMany({
          where: { id_empresa: idEmpresa },
        });

        if (horarios.length > 0) {
          await transaction.horario.createMany({
            data: horarios.map((horario) => ({
              id_empresa: idEmpresa,
              dia_semana: horario.diaSemana,
              hora_apertura: toDatabaseTime(horario.horaApertura),
              hora_cierre: toDatabaseTime(horario.horaCierre),
            })),
          });
        }

        return transaction.horario.findMany({
          where: { id_empresa: idEmpresa },
          orderBy: [{ dia_semana: 'asc' }, { hora_apertura: 'asc' }],
        });
      },
    );

    return updatedHorarios.map(toDomain);
  }
}

function toDomain(horario: PrismaHorario): HorarioEmpresa {
  return {
    diaSemana: horario.dia_semana,
    horaApertura: formatDatabaseTime(horario.hora_apertura),
    horaCierre: formatDatabaseTime(horario.hora_cierre),
  };
}

function toDatabaseTime(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function formatDatabaseTime(value: Date): string {
  return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
}
