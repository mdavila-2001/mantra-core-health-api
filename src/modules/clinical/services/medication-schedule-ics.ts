import { DateTime, IANAZone } from 'luxon';
import {
  medicationDosesBetween,
  type EmptyScheduleReason,
  type LocalTime,
  type ResolvedMedicationSchedule,
} from './medication-schedule';

/* ============================================================================
    iCalendar (RFC 5545) del cronograma de tomas de una receta

    Función pura: recibe el cronograma ya resuelto y devuelve el texto del
    calendario. Lo que decide la forma:

    - **Sin nombre del fármaco ni ningún dato del paciente.** El archivo sale de
      la plataforma a un calendario de terceros (Google, Apple, Outlook) que lo
      sincroniza y lo muestra en notificaciones: el resumen es genérico y el
      detalle se consulta en la receta, dentro de la app.
    - **RRULE cuando la frecuencia es regular.** Horas del día → una VEVENT por
      hora con `FREQ=DAILY`; frecuencia por período con un intervalo entero en
      minutos → una VEVENT con `FREQ=WEEKLY|DAILY|HOURLY|MINUTELY;INTERVAL=n`.
      Un intervalo no entero (7 veces por día) no se expresa con RRULE: se
      emiten VEVENTs sueltas, con tope.
    - **`TZID` + `VTIMEZONE` sólo para zonas de desfase fijo** (La Paz, −04:00,
      sin horario de verano). Una zona con horario de verano necesitaría las
      reglas STANDARD/DAYLIGHT completas; ahí se emiten las horas en UTC, y una
      recurrencia diaria puede correrse una hora al cambiar el horario. Se
      documenta en vez de fingir soporte.
    - **RFC 5545 exige al menos un componente**: una posología sin tomas (PRN,
      duración 0) no produce calendario sino `EmptyMedicationScheduleError`, que
      el controlador traduce a 422.
   ========================================================================== */

const CRLF = '\r\n';

/** Tope de octetos por línea antes de plegar (RFC 5545 §3.1). */
const MAX_LINE_OCTETS = 75;

/** Tope de VEVENTs sueltas para un intervalo irregular. */
const DEFAULT_MAX_IRREGULAR_EVENTS = 200;

/** Horizonte de las VEVENTs sueltas cuando el tratamiento no tiene fin. */
const DEFAULT_IRREGULAR_HORIZON_DAYS = 30;

const PRODID = '-//Alovida//Recordatorios de medicacion//ES';

/** Resumen genérico: nunca el nombre del fármaco. */
export const MEDICATION_DOSE_SUMMARY = 'Toma de medicamento';

const MEDICATION_DOSE_DESCRIPTION =
  'Recordatorio de toma. Consultá la dosis en tu receta de Alovida.';

/** Lo que el constructor necesita. */
export interface MedicationScheduleIcsInput {
  /** Receta: sólo se usa para el UID estable. */
  readonly requestId: string;
  /** Cronograma resuelto por `resolveMedicationSchedule`. */
  readonly schedule: ResolvedMedicationSchedule;
  /** Instante de generación (DTSTAMP). */
  readonly now: Date;
  /** Tope de VEVENTs sueltas de un intervalo irregular. */
  readonly maxIrregularEvents?: number;
  /** Horizonte de las VEVENTs sueltas cuando no hay fin. */
  readonly irregularHorizonDays?: number;
}

/** El cronograma no tiene tomas: no hay calendario válido que emitir. */
export class EmptyMedicationScheduleError extends Error {
  /** @param reason - Por qué no hay tomas. */
  constructor(readonly reason: EmptyScheduleReason | 'NO_DOSES') {
    super(emptyScheduleMessage(reason));
    this.name = 'EmptyMedicationScheduleError';
  }
}

/** Mensaje en castellano para cada motivo de cronograma vacío. */
export function emptyScheduleMessage(
  reason: EmptyScheduleReason | 'NO_DOSES',
): string {
  switch (reason) {
    case 'AS_NEEDED':
      return 'La receta es «según necesidad»: no tiene tomas programadas que exportar.';
    case 'ZERO_DURATION':
    case 'NO_DOSES':
      return 'La posología no deja ninguna toma dentro de su duración o vigencia.';
    case 'NO_TIMING':
      return 'La receta no tiene posología estructurada (frecuencia u horas del día).';
    case 'NO_START':
      return 'La posología no tiene fecha de inicio: no se puede ubicar la primera toma.';
  }
}

/**
 * Construye el calendario.
 *
 * @param input - Receta, cronograma e instante de generación.
 * @returns El texto iCalendar, con CRLF y líneas plegadas.
 * @throws EmptyMedicationScheduleError si no hay ninguna toma.
 */
export function buildMedicationScheduleIcs(
  input: MedicationScheduleIcsInput,
): string {
  const { schedule } = input;
  if (schedule.kind === 'EMPTY') {
    throw new EmptyMedicationScheduleError(schedule.reason);
  }

  const zone = fixedOffsetZone(schedule.timeZone, schedule.start);
  const dtstamp = formatUtc(input.now);
  const until = schedule.endExclusive
    ? formatUtc(new Date(schedule.endExclusive.getTime() - 1000))
    : undefined;

  const events: string[][] = [];
  if (schedule.kind === 'TIMES_OF_DAY') {
    for (const time of schedule.times) {
      const first = firstOccurrence(schedule.start, schedule.timeZone, time);
      if (schedule.endExclusive && first >= schedule.endExclusive) continue;
      events.push(
        vevent({
          uid: `${input.requestId}-t${pad(time.hour)}${pad(time.minute)}@alovida`,
          dtstamp,
          dtstart: dtstartLine(first, zone),
          rrule: `FREQ=DAILY${until ? `;UNTIL=${until}` : ''}`,
        }),
      );
    }
  } else if (Number.isInteger(schedule.intervalMinutes)) {
    events.push(
      vevent({
        uid: `${input.requestId}-every@alovida`,
        dtstamp,
        dtstart: dtstartLine(schedule.start, zone),
        rrule:
          recurrenceOf(schedule.intervalMinutes) +
          (until ? `;UNTIL=${until}` : ''),
      }),
    );
  } else {
    const horizon =
      schedule.endExclusive ??
      DateTime.fromJSDate(schedule.start)
        .plus({
          days: input.irregularHorizonDays ?? DEFAULT_IRREGULAR_HORIZON_DAYS,
        })
        .toJSDate();
    const doses = medicationDosesBetween(
      schedule,
      schedule.start,
      horizon,
      input.maxIrregularEvents ?? DEFAULT_MAX_IRREGULAR_EVENTS,
    );
    doses.forEach((dose, index) =>
      events.push(
        vevent({
          uid: `${input.requestId}-${index + 1}@alovida`,
          dtstamp,
          dtstart: dtstartLine(dose, zone),
        }),
      ),
    );
  }

  if (events.length === 0) throw new EmptyMedicationScheduleError('NO_DOSES');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText('Tomas de medicamento')}`,
    ...(zone ? vtimezone(zone) : []),
    ...events.flat(),
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/**
 * Pliega una línea de contenido a 75 octetos (RFC 5545 §3.1): las líneas de
 * continuación empiezan con un espacio. Nunca corta un carácter UTF-8 por la
 * mitad.
 */
export function foldLine(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= MAX_LINE_OCTETS) return line;
  const parts: string[] = [];
  let current = '';
  let currentOctets = 0;
  // La primera línea admite 75 octetos; las siguientes 74 más el espacio.
  let limit = MAX_LINE_OCTETS;
  for (const char of line) {
    const octets = Buffer.byteLength(char, 'utf8');
    if (currentOctets + octets > limit) {
      parts.push(current);
      current = '';
      currentOctets = 0;
      limit = MAX_LINE_OCTETS - 1;
    }
    current += char;
    currentOctets += octets;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

/** Escapa un valor TEXT (RFC 5545 §3.3.11). */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Zona de desfase fijo que se puede declarar con un VTIMEZONE mínimo. */
interface FixedOffsetZone {
  readonly tzid: string;
  /** Desfase en minutos respecto de UTC. */
  readonly offsetMinutes: number;
}

/**
 * La zona, si su desfase no cambia en el año del inicio (sin horario de
 * verano). `undefined` → se emite en UTC.
 */
function fixedOffsetZone(
  timeZone: string,
  start: Date,
): FixedOffsetZone | undefined {
  const zone = IANAZone.create(timeZone);
  const year = DateTime.fromJSDate(start, { zone: timeZone }).year;
  const january = Date.UTC(year, 0, 1);
  const july = Date.UTC(year, 6, 1);
  const offset = zone.offset(january);
  if (offset !== zone.offset(july)) return undefined;
  return { tzid: timeZone, offsetMinutes: offset };
}

/** VTIMEZONE mínimo para una zona de desfase fijo. */
function vtimezone(zone: FixedOffsetZone): string[] {
  const offset = formatOffset(zone.offsetMinutes);
  return [
    'BEGIN:VTIMEZONE',
    `TZID:${zone.tzid}`,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    `TZOFFSETFROM:${offset}`,
    `TZOFFSETTO:${offset}`,
    `TZNAME:${zone.offsetMinutes % 60 === 0 ? offset.slice(0, 3) : offset}`,
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
}

/** Una VEVENT de toma, con alarma al momento de la toma. */
function vevent(event: {
  uid: string;
  dtstamp: string;
  dtstart: string;
  rrule?: string;
}): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${event.dtstamp}`,
    event.dtstart,
    'DURATION:PT15M',
    ...(event.rrule ? [`RRULE:${event.rrule}`] : []),
    `SUMMARY:${escapeText(MEDICATION_DOSE_SUMMARY)}`,
    `DESCRIPTION:${escapeText(MEDICATION_DOSE_DESCRIPTION)}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(MEDICATION_DOSE_SUMMARY)}`,
    'TRIGGER:PT0S',
    'END:VALARM',
    'END:VEVENT',
  ];
}

/** `FREQ` + `INTERVAL` para un intervalo entero de minutos. */
function recurrenceOf(intervalMinutes: number): string {
  const units: [string, number][] = [
    ['WEEKLY', 60 * 24 * 7],
    ['DAILY', 60 * 24],
    ['HOURLY', 60],
    ['MINUTELY', 1],
  ];
  for (const [freq, minutes] of units) {
    if (intervalMinutes % minutes === 0) {
      const interval = intervalMinutes / minutes;
      return interval === 1
        ? `FREQ=${freq}`
        : `FREQ=${freq};INTERVAL=${interval}`;
    }
  }
  // Inalcanzable: todo entero es múltiplo de 1.
  return `FREQ=MINUTELY;INTERVAL=${intervalMinutes}`;
}

/** Primera toma a una hora local dada, en o después del ancla. */
function firstOccurrence(start: Date, timeZone: string, time: LocalTime): Date {
  const anchor = DateTime.fromJSDate(start, { zone: timeZone });
  let candidate = anchor.set({
    hour: time.hour,
    minute: time.minute,
    second: 0,
    millisecond: 0,
  });
  if (candidate < anchor) candidate = candidate.plus({ days: 1 });
  return candidate.toJSDate();
}

/** `DTSTART;TZID=…:local` o `DTSTART:…Z`. */
function dtstartLine(at: Date, zone: FixedOffsetZone | undefined): string {
  if (!zone) return `DTSTART:${formatUtc(at)}`;
  const local = DateTime.fromJSDate(at, { zone: zone.tzid }).toFormat(
    "yyyyMMdd'T'HHmmss",
  );
  return `DTSTART;TZID=${zone.tzid}:${local}`;
}

/** Fecha-hora UTC en forma básica (`20260926T120000Z`). */
function formatUtc(at: Date): string {
  return DateTime.fromJSDate(at, { zone: 'utc' }).toFormat(
    "yyyyMMdd'T'HHmmss'Z'",
  );
}

/** `-0400` a partir de −240 minutos. */
function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
