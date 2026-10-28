import {
  dayOfWeek,
  localDayOf,
  localTimeToUtc,
  type LocalDay,
} from '../time/scheduling-time';

/** Lo mínimo de una franja para saber si admite telemedicina en un instante. */
export interface TelemedicineBand {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly telemedicineEnabled: boolean;
  /** Vigencia de la plantilla, en días del calendario local (inclusive). */
  readonly validFrom?: Date | null;
  readonly validTo?: Date | null;
}

/** `YYYY-MM-DD` de un día local, para comparar con la vigencia sin zonas. */
function isoOf(day: LocalDay): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${day.year}-${pad(day.month)}-${pad(day.day)}`;
}

/** `YYYY-MM-DD` de una columna `date`, que MikroORM trae a medianoche UTC. */
function isoOfDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Si el instante cae dentro de una franja con la telemedicina habilitada.
 *
 * Las franjas son horas de pared de la sede (`zone`): «los martes de 15 a 19».
 * Se mira el día local del instante, su día de la semana y si el inicio cae en
 * `[startTime, endTime)` de alguna franja vigente con `telemedicineEnabled`.
 * Una franja sin telemedicina, o ninguna franja, responde `false`: por defecto
 * la telemedicina está apagada.
 *
 * @param startAt - Inicio de la cita.
 * @param bands - Franjas de las plantillas publicadas del recurso.
 * @param zone - Zona IANA de la sede; sin zona declarada, `UTC`.
 */
export function startsInTelemedicineBand(
  startAt: Date,
  bands: readonly TelemedicineBand[],
  zone: string,
): boolean {
  const day = localDayOf(startAt, zone);
  const weekday = dayOfWeek(day);
  const iso = isoOf(day);
  return bands.some((band) => {
    if (!band.telemedicineEnabled || band.dayOfWeek !== weekday) return false;
    if (band.validFrom && iso < isoOfDate(band.validFrom)) return false;
    if (band.validTo && iso > isoOfDate(band.validTo)) return false;
    const from = localTimeToUtc(day, band.startTime, zone);
    const to = localTimeToUtc(day, band.endTime, zone);
    return from <= startAt && startAt < to;
  });
}
