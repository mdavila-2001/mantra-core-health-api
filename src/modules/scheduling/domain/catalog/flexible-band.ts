import { dayOfWeek, localDayOf, localTimeToUtc } from '../time/scheduling-time';

/** Lo mínimo de una franja para saber si es de horario flexible. */
export interface FlexibleBand {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  /** Horario flexible de la franja (v4.2.64). Ausente ≡ `false`. */
  readonly flexibleHours?: boolean;
}

/**
 * Si la franja es de horario flexible.
 *
 * La plantilla sigue declarando el suyo, y `true` en la plantilla implica
 * `true` en todas sus franjas: una plantilla toda flexible se comporta igual
 * que antes de que la franja pudiera decirlo. Con la plantilla en `false`,
 * cada franja dice el suyo.
 *
 * @param templateFlexible - `flexibleHours` de la plantilla.
 * @param band - La franja.
 */
export function isFlexibleBand(
  templateFlexible: boolean,
  band: Pick<FlexibleBand, 'flexibleHours'>,
): boolean {
  return templateFlexible || band.flexibleHours === true;
}

/**
 * Si el instante cae dentro de una franja de horario flexible.
 *
 * El cupo no guarda de qué franja salió (`bookable_slots` sólo referencia la
 * plantilla), así que la franja se ubica **por día y hora**, igual que
 * {@link startsInTelemedicineBand}: el día local del instante, su día de la
 * semana y si cae en `[startTime, endTime)` de alguna franja flexible.
 *
 * @param startAt - Inicio del cupo.
 * @param templateFlexible - `flexibleHours` de la plantilla del cupo.
 * @param bands - Las franjas de esa plantilla.
 * @param zone - Zona IANA de la sede; sin zona declarada, `UTC`.
 */
export function startsInFlexibleBand(
  startAt: Date,
  templateFlexible: boolean,
  bands: readonly FlexibleBand[],
  zone: string,
): boolean {
  const day = localDayOf(startAt, zone);
  const weekday = dayOfWeek(day);
  return bands.some((band) => {
    if (!isFlexibleBand(templateFlexible, band)) return false;
    if (band.dayOfWeek !== weekday) return false;
    const from = localTimeToUtc(day, band.startTime, zone);
    const to = localTimeToUtc(day, band.endTime, zone);
    return from <= startAt && startAt < to;
  });
}
