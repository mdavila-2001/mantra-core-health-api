/**
 * Censo diario e indicadores hospitalarios (CONTRATO-F2-F5 §F3.3,
 * «Definiciones del censo» e «Indicadores», convención OPS). Puro.
 */

/** Una estancia en cama de la unidad (ubicación ACTIVE o COMPLETED). */
export interface StaySegment {
  readonly encounterId: string;
  readonly start: Date;
  readonly end: Date | null;
  /** Cómo empezó: ingreso, o traslado desde otra unidad. */
  readonly startKind: 'ADMIT' | 'TRANSFER_IN' | 'INTERNAL';
  /** Cómo terminó: egreso, traslado a otra unidad, o movimiento interno. */
  readonly endKind: 'DISCHARGE' | 'DEATH' | 'TRANSFER_OUT' | 'INTERNAL' | null;
  /** Inicio del encuentro (para días de estancia del egreso). */
  readonly admittedAt: Date;
}

/** Ventana de un día local: `[dayStart, cutoff)`. */
export interface CensusWindow {
  readonly dayStart: Date;
  readonly cutoff: Date;
}

/** Contadores del día (columnas numéricas de `inpatient_census_days`). */
export interface CensusCounts {
  bedsCensable: number;
  bedsAvailable: number;
  bedsBlocked: number;
  patientsAtCutoff: number;
  admissions: number;
  discharges: number;
  deaths: number;
  transfersIn: number;
  transfersOut: number;
  sameDayStays: number;
  patientDays: number;
  dischargeStayDays: number;
}

/** Columnas que un ajuste puede tocar (CHECK del modelo). */
export const CENSUS_FIELDS: readonly (keyof CensusCounts)[] = [
  'bedsCensable',
  'bedsAvailable',
  'bedsBlocked',
  'patientsAtCutoff',
  'admissions',
  'discharges',
  'deaths',
  'transfersIn',
  'transfersOut',
  'sameDayStays',
  'patientDays',
  'dischargeStayDays',
];

/** `field_code` en snake_case, como lo guarda el modelo. */
export function fieldColumn(field: keyof CensusCounts): string {
  return field.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Días de estancia de un egreso = fecha(egreso) − fecha(ingreso), mínimo 1.
 *
 * @param admitted - Ingreso.
 * @param discharged - Egreso.
 * @param offsetMinutes - Desfase local de la sede respecto de UTC.
 */
export function stayDays(
  admitted: Date,
  discharged: Date,
  offsetMinutes = 0,
): number {
  const day = (d: Date) =>
    Math.floor((d.getTime() + offsetMinutes * 60_000) / 86_400_000);
  return Math.max(1, day(discharged) - day(admitted));
}

/**
 * Cuenta el día D de una unidad a partir de sus estancias y camas.
 * `patient_days = patients_at_cutoff + same_day_stays` (convención OPS).
 *
 * @param segments - Estancias en camas de la unidad que tocan el día.
 * @param window - `[00:00 D, 00:00 D+1)` local.
 * @param beds - Camas censables y disponibles en el corte.
 * @param offsetMinutes - Desfase local (para días de estancia).
 */
export function computeCensus(
  segments: readonly StaySegment[],
  window: CensusWindow,
  beds: { censable: number; available: number },
  offsetMinutes = 0,
): CensusCounts {
  const inDay = (d: Date | null) =>
    !!d && d >= window.dayStart && d < window.cutoff;
  const c: CensusCounts = {
    bedsCensable: beds.censable,
    bedsAvailable: beds.available,
    bedsBlocked: Math.max(0, beds.censable - beds.available),
    patientsAtCutoff: 0,
    admissions: 0,
    discharges: 0,
    deaths: 0,
    transfersIn: 0,
    transfersOut: 0,
    sameDayStays: 0,
    patientDays: 0,
    dischargeStayDays: 0,
  };
  for (const s of segments) {
    if (s.start <= window.cutoff && (!s.end || s.end > window.cutoff))
      c.patientsAtCutoff += 1;
    if (inDay(s.start)) {
      if (s.startKind === 'ADMIT') c.admissions += 1;
      if (s.startKind === 'TRANSFER_IN') c.transfersIn += 1;
    }
    if (inDay(s.end)) {
      if (s.endKind === 'DISCHARGE' || s.endKind === 'DEATH') {
        c.discharges += 1;
        c.dischargeStayDays += stayDays(
          s.admittedAt,
          s.end as Date,
          offsetMinutes,
        );
      }
      if (s.endKind === 'DEATH') c.deaths += 1;
      if (s.endKind === 'TRANSFER_OUT') c.transfersOut += 1;
    }
    if (
      inDay(s.start) &&
      inDay(s.end) &&
      s.startKind !== 'INTERNAL' &&
      s.endKind !== 'INTERNAL'
    ) {
      c.sameDayStays += 1;
    }
  }
  c.patientDays = c.patientsAtCutoff + c.sameDayStays;
  return c;
}

/** Indicadores del período (§F3.3). */
export interface Indicators {
  days: number;
  bedDaysAvailable: number;
  patientDays: number;
  admissions: number;
  discharges: number;
  dischargeStayDays: number;
  avgBeds: number;
  occupancyPct: number | null;
  alos: number | null;
  bedTurnover: number | null;
  turnoverInterval: number | null;
  crossCheck: { occupancyFromAlos: number | null; deltaPct: number | null };
}

/**
 * Indicadores sobre días cerrados (con ajustes ya aplicados).
 *
 * @param days - Contadores de cada día cerrado.
 * @param periodDays - Días del período pedido.
 */
export function computeIndicators(
  days: readonly CensusCounts[],
  periodDays: number,
): Indicators {
  const sum = (k: keyof CensusCounts) => days.reduce((a, d) => a + d[k], 0);
  const bedDaysAvailable = sum('bedsAvailable');
  const patientDays = sum('patientDays');
  const discharges = sum('discharges');
  const dischargeStayDays = sum('dischargeStayDays');
  const avgBeds = periodDays > 0 ? bedDaysAvailable / periodDays : 0;
  const occupancyPct =
    bedDaysAvailable > 0 ? (patientDays / bedDaysAvailable) * 100 : null;
  const alos = discharges > 0 ? dischargeStayDays / discharges : null;
  const bedTurnover = avgBeds > 0 ? discharges / avgBeds : null;
  const turnoverInterval =
    discharges > 0 ? (bedDaysAvailable - patientDays) / discharges : null;
  const occupancyFromAlos =
    alos !== null && bedTurnover !== null && periodDays > 0
      ? ((alos * bedTurnover) / periodDays) * 100
      : null;
  const deltaPct =
    occupancyFromAlos !== null && occupancyPct
      ? Math.abs(occupancyFromAlos - occupancyPct)
      : null;
  return {
    days: periodDays,
    bedDaysAvailable,
    patientDays,
    admissions: sum('admissions'),
    discharges,
    dischargeStayDays,
    avgBeds,
    occupancyPct,
    alos,
    bedTurnover,
    turnoverInterval,
    crossCheck: { occupancyFromAlos, deltaPct },
  };
}

/** Percentil `p` (0–100) de una lista (interpolación por el más cercano). */
export function percentile(
  values: readonly number[],
  p: number,
): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

/**
 * Desfase en minutos de una zona horaria en un instante (Intl, sin dependencias).
 *
 * @param timeZone - IANA (`America/La_Paz`).
 * @param at - Instante.
 */
export function zoneOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
  );
  return Math.round(
    (asUtc - Math.floor(at.getTime() / 60_000) * 60_000) / 60_000,
  );
}

/**
 * `[00:00 D, 00:00 D+1)` de la fecha `yyyy-mm-dd` en la zona de la sede.
 *
 * @param date - Día local.
 * @param timeZone - Zona de la sede.
 */
export function localDayWindow(date: string, timeZone: string): CensusWindow {
  const [y, m, d] = date.split('-').map(Number);
  const guessStart = new Date(Date.UTC(y, m - 1, d));
  const guessEnd = new Date(Date.UTC(y, m - 1, d + 1));
  const dayStart = new Date(
    guessStart.getTime() - zoneOffsetMinutes(timeZone, guessStart) * 60_000,
  );
  const cutoff = new Date(
    guessEnd.getTime() - zoneOffsetMinutes(timeZone, guessEnd) * 60_000,
  );
  return { dayStart, cutoff };
}
