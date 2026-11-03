/**
 * Devengo de cargos de espacio (CONTRATO-F2-F5 §F5e). Puro.
 *
 * **Regla de medianoche (D7)**: por cada medianoche local M en la que el
 * encuentro ocupa una cama (ubicación ACTIVE/COMPLETED cuyo rango contiene M)
 * se devenga **un** día-cama con `service_date = fecha(M) − 1`, en la cama
 * ocupada en M. El día del egreso no se cobra. Una estancia que no cruza
 * ninguna medianoche y ya terminó cuenta 1 día si `minOneDay`.
 */

/** Un tramo en cama. */
export interface BedSegment {
  readonly careSpaceId: string;
  readonly start: Date;
  readonly end: Date | null;
}

/** Un día-cama a devengar. */
export interface BedDay {
  /** `yyyy-mm-dd` local. */
  readonly serviceDate: string;
  readonly careSpaceId: string;
  /** Instante de la medianoche que lo genera (para elegir categoría vigente). */
  readonly midnight: Date;
}

const DAY = 86_400_000;

/** `yyyy-mm-dd` del instante en hora local (`offsetMinutes` = local − UTC). */
function localDate(at: Date, offsetMinutes: number): string {
  return new Date(at.getTime() + offsetMinutes * 60_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Días-cama de un encuentro.
 *
 * @param segments - Tramos en cama, en orden.
 * @param offsetMinutes - Desfase local de la sede (constante en el rango).
 * @param until - Hasta cuándo devengar (ahora, o el egreso).
 * @param minOneDay - `billing.bed_day_min_one`.
 * @param ended - El encuentro terminó (para el mínimo de un día).
 */
export function bedDays(
  segments: readonly BedSegment[],
  offsetMinutes: number,
  until: Date,
  minOneDay: boolean,
  ended: boolean,
): BedDay[] {
  if (segments.length === 0) return [];
  const first = segments[0].start;
  const out: BedDay[] = [];
  // Primera medianoche local estrictamente posterior al inicio.
  const firstLocal = new Date(first.getTime() + offsetMinutes * 60_000);
  let m = new Date(
    Date.UTC(
      firstLocal.getUTCFullYear(),
      firstLocal.getUTCMonth(),
      firstLocal.getUTCDate() + 1,
    ) -
      offsetMinutes * 60_000,
  );
  for (; m <= until; m = new Date(m.getTime() + DAY)) {
    const seg = segments.find((s) => s.start <= m && (!s.end || s.end > m));
    if (!seg) continue;
    out.push({
      serviceDate: localDate(new Date(m.getTime() - DAY), offsetMinutes),
      careSpaceId: seg.careSpaceId,
      midnight: m,
    });
  }
  if (out.length === 0 && minOneDay && ended) {
    out.push({
      serviceDate: localDate(first, offsetMinutes),
      careSpaceId: segments[0].careSpaceId,
      midnight: first,
    });
  }
  return out;
}

/**
 * Unidades de quirófano por tiempo: `max(minimum_units, ceil(min ÷ unit))`.
 *
 * @param minutes - Minutos de uso.
 * @param unitMinutes - Minutos por unidad (15/30/60).
 * @param minimumUnits - Mínimo facturable.
 */
export function orTimeUnits(
  minutes: number,
  unitMinutes: number,
  minimumUnits = 0,
): number {
  if (!(unitMinutes > 0) || minutes <= 0) return Math.max(minimumUnits, 0);
  return Math.max(minimumUnits, Math.ceil(minutes / unitMinutes));
}
