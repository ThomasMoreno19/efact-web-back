import { DomainValidationException } from '@/shared/domain/exceptions/domain-validation.exception';
import { EmpresaNotFoundException } from '../../exceptions/empresa-not-found.exception';
import type { EmpresaRepository } from '../../ports/empresa.repository';
import type {
  HorarioEmpresa,
  HorarioEmpresaRepository,
} from '../../ports/horario-empresa.repository';

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

interface WeeklyInterval {
  inicio: number;
  fin: number;
}

export class ReplaceHorariosEmpresaUseCase {
  constructor(
    private readonly empresas: EmpresaRepository,
    private readonly horarios: HorarioEmpresaRepository,
  ) {}

  async execute(idEmpresa: number, horarios: HorarioEmpresa[]) {
    const empresa = await this.empresas.findById(idEmpresa);
    if (!empresa) throw new EmpresaNotFoundException(idEmpresa);

    validateHorarios(horarios);
    return this.horarios.replaceByEmpresaId(idEmpresa, horarios);
  }
}

function validateHorarios(horarios: HorarioEmpresa[]): void {
  const intervalos: WeeklyInterval[] = [];

  for (const horario of horarios) {
    if (
      !Number.isInteger(horario.diaSemana) ||
      horario.diaSemana < 0 ||
      horario.diaSemana > 6
    ) {
      throw new DomainValidationException('El día de la semana no es válido.');
    }

    const apertura = timeToMinutes(horario.horaApertura);
    const cierre = timeToMinutes(horario.horaCierre);
    if (apertura === cierre) {
      throw new DomainValidationException(
        'La hora de apertura y la de cierre no pueden ser iguales.',
      );
    }

    const duracion =
      cierre < apertura
        ? cierre + MINUTES_PER_DAY - apertura
        : cierre - apertura;
    const inicio = horario.diaSemana * MINUTES_PER_DAY + apertura;
    intervalos.push({ inicio, fin: inicio + duracion });
  }

  for (let firstIndex = 0; firstIndex < intervalos.length; firstIndex += 1) {
    const first = intervalos[firstIndex];
    if (!first) continue;

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < intervalos.length;
      secondIndex += 1
    ) {
      const second = intervalos[secondIndex];
      if (second && weeklyIntervalsOverlap(first, second)) {
        throw new DomainValidationException(
          'Los horarios no pueden superponerse, incluso al cruzar la medianoche.',
        );
      }
    }
  }
}

function weeklyIntervalsOverlap(
  first: WeeklyInterval,
  second: WeeklyInterval,
): boolean {
  for (const weekOffset of [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK]) {
    const inicioSegundo = second.inicio + weekOffset;
    const finSegundo = second.fin + weekOffset;
    if (first.inicio < finSegundo && inicioSegundo < first.fin) return true;
  }
  return false;
}

function timeToMinutes(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new DomainValidationException('La hora debe tener formato HH:mm.');
  }
  return Number(match[1]) * 60 + Number(match[2]);
}
