import { dayOfWeek, localDayOf, localTimeToUtc } from '../time/scheduling-time';
import {
  intervalInWeek,
  overlap,
  referenceWeek,
  bandLabel,
} from './week-bands';

/**
 * Reglas puras de la agenda por espacio (F5d): qué espacios pueden tener horario propio, cuándo
 * dos plantillas ocupan el mismo consultorio a la misma hora y a quién afecta un bloqueo.
 *
 * Nada acá toca la base: las comprobaciones que necesitan datos (el espacio, sus plantillas)
 * las hace `CareSpaceTemplateGuard`, que llama a estas funciones.
 */

/**
 * Funciones de espacio cuyo horario se publica en una plantilla (CONTRATO-F2-F5 F5d):
 * consultorio, sala de procedimientos y sala de imagen. El quirófano tiene su propio
 * mecanismo (bloques de F4) y no entra por acá.
 */
export const AGENDA_SPACE_FUNCTIONS: readonly string[] = [
  'SPACE_FN_CONSULTING_ROOM',
  'SPACE_FN_PROCEDURE_ROOM',
  'SPACE_FN_IMAGING_ROOM',
];

/** Fin de una excepción de un bloqueo sin fecha estimada: «hasta que alguien lo levante». */
export const OPEN_ENDED_BLOCK_END = new Date('9999-12-31T00:00:00.000Z');

/** Una franja semanal tal como la guarda la plantilla. */
export interface WeekBand {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
}

/** Lo que de una plantilla importa para saber si pisa a otra en el mismo espacio. */
export interface SpacePlan {
  /** Vigencia desde (inclusive); ausente ≡ desde siempre. */
  readonly validFrom?: Date | null;
  /** Vigencia hasta (inclusive); ausente ≡ permanente. */
  readonly validTo?: Date | null;
  /** Zona en la que están escritas las horas de pared de las franjas. */
  readonly timeZone: string;
  readonly bands: readonly WeekBand[];
}

/** Si dos vigencias comparten algún día. Las abiertas por un extremo no lo acotan. */
export function validitiesIntersect(
  a: Pick<SpacePlan, 'validFrom' | 'validTo'>,
  b: Pick<SpacePlan, 'validFrom' | 'validTo'>,
): boolean {
  const aFrom = a.validFrom?.getTime() ?? Number.NEGATIVE_INFINITY;
  const aTo = a.validTo?.getTime() ?? Number.POSITIVE_INFINITY;
  const bFrom = b.validFrom?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bTo = b.validTo?.getTime() ?? Number.POSITIVE_INFINITY;
  return aFrom <= bTo && bFrom <= aTo;
}

/** El choque entre dos plantillas del mismo espacio: cuál franja de cada una. */
export interface SpaceBandClash {
  readonly mine: string;
  readonly other: string;
}

/**
 * Primera franja de `mine` que ocupa el consultorio a la misma hora que una de `other`.
 *
 * Se comparan **instantes**, no textos: cada plantilla escribe horas de pared en la zona de
 * su recurso, y «09:00» de La Paz y «09:00» de São Paulo no son el mismo rato. Las dos se
 * proyectan sobre una semana de referencia dentro de la vigencia común (la misma técnica que
 * `AgendaOverlapGuard`). Los extremos no cuentan: terminar a las 12:00 y empezar a las 12:00
 * no es estar dos veces en el consultorio.
 *
 * Devuelve `null` si las vigencias no se tocan o si ninguna franja se cruza.
 *
 * @param mine - La plantilla que se publica o edita.
 * @param other - Otra plantilla vigente del mismo espacio.
 * @param now - Ahora: ancla la semana de referencia cuando las dos vigencias son abiertas.
 */
export function findSpaceBandClash(
  mine: SpacePlan,
  other: SpacePlan,
  now: Date,
): SpaceBandClash | null {
  if (!validitiesIntersect(mine, other)) return null;
  const anchor = Math.max(
    mine.validFrom?.getTime() ?? Number.NEGATIVE_INFINITY,
    other.validFrom?.getTime() ?? Number.NEGATIVE_INFINITY,
    now.getTime(),
  );
  // Una vigencia común que ya terminó no pisa a nadie hoy; quien cambió de consultorio el mes
  // pasado no queda trabado por una plantilla vencida.
  const horizon = Math.min(
    mine.validTo?.getTime() ?? Number.POSITIVE_INFINITY,
    other.validTo?.getTime() ?? Number.POSITIVE_INFINITY,
  );
  if (horizon < now.getTime()) return null;
  const week = referenceWeek(new Date(anchor));
  for (const a of mine.bands) {
    const left = intervalInWeek(
      week,
      a.dayOfWeek,
      a.startTime,
      a.endTime,
      mine.timeZone,
    );
    for (const b of other.bands) {
      const right = intervalInWeek(
        week,
        b.dayOfWeek,
        b.startTime,
        b.endTime,
        other.timeZone,
      );
      if (overlap(left, right)) {
        return { mine: bandLabel(a), other: bandLabel(b) };
      }
    }
  }
  return null;
}

/** Una ventana de tiempo. */
export interface TimeWindow {
  readonly start: Date;
  readonly end: Date;
}

/** Si el cupo `[start, end)` toca la ventana. Los extremos no cuentan. */
export function windowTouches(slot: TimeWindow, window: TimeWindow): boolean {
  return slot.start < window.end && window.start < slot.end;
}

/** Una franja con la plantilla a la que pertenece y su vigencia. */
export interface TemplateBand extends WeekBand {
  readonly templateId: string;
  readonly careSpaceId?: string | null;
  /** Vigencia de la plantilla, en días del calendario local (inclusive). */
  readonly validFrom?: Date | null;
  readonly validTo?: Date | null;
}

/** `YYYY-MM-DD` de un día local, para comparar con la vigencia sin zonas. */
function isoOfLocalDay(day: {
  year: number;
  month: number;
  day: number;
}): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${day.year}-${pad(day.month)}-${pad(day.day)}`;
}

/**
 * La franja publicada que contiene el instante, o `null` si ninguna lo contiene.
 *
 * Las franjas son horas de pared de la sede (`zone`): se mira el día local del instante, su
 * día de la semana y si el inicio cae en `[startTime, endTime)` de una franja vigente. Es la
 * misma lectura que hace la telemedicina por franja, pero devuelve la franja (y con ella la
 * plantilla y su espacio) en vez de un booleano.
 *
 * @param startAt - Inicio de la cita.
 * @param bands - Franjas de las plantillas publicadas del recurso.
 * @param zone - Zona IANA del recurso; sin zona, `UTC`.
 */
export function bandContaining<T extends TemplateBand>(
  startAt: Date,
  bands: readonly T[],
  zone: string,
): T | null {
  const day = localDayOf(startAt, zone);
  const weekday = dayOfWeek(day);
  const iso = isoOfLocalDay(day);
  for (const band of bands) {
    if (band.dayOfWeek !== weekday) continue;
    if (band.validFrom && iso < band.validFrom.toISOString().slice(0, 10))
      continue;
    if (band.validTo && iso > band.validTo.toISOString().slice(0, 10)) continue;
    const from = localTimeToUtc(day, band.startTime, zone);
    const to = localTimeToUtc(day, band.endTime, zone);
    if (from <= startAt && startAt < to) return band;
  }
  return null;
}
