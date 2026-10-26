/**
 * Horario flexible, sin turnos fijos (P36 · v4.2.52).
 *
 * ## Qué es
 *
 * El médico declara **cuándo atiende** —«martes de 08:00 a 12:00»— pero no lo
 * corta en turnos. El paciente pide la hora que quiera dentro de la franja y la
 * consulta ocupa lo que la plantilla dice que se reserva por paciente
 * (`slotMinutes`).
 *
 * ## Por qué reusa el motor de los servicios
 *
 * Es el mismo problema que un servicio de duración dinámica (v4.2.40): no hay una
 * grilla pre-generada, así que qué horarios caben se **calcula** en lectura
 * (franjas menos tiempo ocupado) y el cupo nace recién al retener, bajo el candado
 * del profesional. Un turno flexible es, para ese motor, un servicio de duración
 * fija y sin colchones. Dos motores para lo mismo serían dos ideas de «qué está
 * libre» que en algún momento discreparían.
 *
 * Todo lo que toca la base lo junta el servicio; acá entra ya resuelto, para que
 * las reglas se prueben sin `EntityManager`.
 */
import {
  localTimeToUtc,
  matchingLocalDays,
  type LocalDay,
} from './scheduling-time';
import type { Interval, ServiceDuration } from './service-availability';

/** Cada cuántos minutos se OFRECE un inicio. Al retener se acepta cualquier minuto. */
export const FLEXIBLE_START_STEP_MINUTES = 15;

/** Lo mínimo de una franja que hace falta para ubicarla en el calendario. */
export interface FlexibleRule {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly validFrom?: Date | string | null;
  readonly validTo?: Date | string | null;
}

/** La vigencia de la plantilla, que cubre a las franjas que no declaran la suya. */
export interface TemplateValidity {
  readonly validFrom?: Date | string | null;
  readonly validTo?: Date | string | null;
}

/**
 * Las franjas de una plantilla flexible dentro de `[from, to)`, en UTC.
 *
 * Cada franja se recorta a la ventana pedida: un inicio ofrecido antes de `from`
 * no le sirve a nadie, y uno después de `to` no se pidió.
 *
 * @param zone - La zona de la sede, en la que están escritas las horas.
 */
export function flexibleBands(
  rules: readonly FlexibleRule[],
  zone: string,
  from: Date,
  to: Date,
  validity: TemplateValidity = {},
): Interval[] {
  const bands: Interval[] = [];
  for (const rule of rules) {
    for (const day of matchingLocalDays(from, to, rule.dayOfWeek, zone)) {
      const validFrom = rule.validFrom ?? validity.validFrom;
      const validTo = rule.validTo ?? validity.validTo;
      if (!validThatDay(day, validFrom, validTo)) continue;
      const start = localTimeToUtc(day, rule.startTime, zone);
      const end = localTimeToUtc(day, rule.endTime, zone);
      const clippedFrom = start < from ? from : start;
      const clippedTo = end > to ? to : end;
      if (clippedTo > clippedFrom) {
        bands.push({ startAt: clippedFrom, endAt: clippedTo });
      }
    }
  }
  return bands.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

/**
 * Un turno flexible visto como un servicio: dura exactamente lo que se reserva
 * por paciente, sin preparación ni limpieza.
 *
 * @throws RangeError si los minutos no son un entero positivo.
 */
export function flexibleDuration(minutesPerPatient: number): ServiceDuration {
  if (!Number.isInteger(minutesPerPatient) || minutesPerPatient <= 0) {
    throw new RangeError(
      `El tiempo por paciente debe ser un entero positivo: ${minutesPerPatient}`,
    );
  }
  return {
    minDurationMinutes: minutesPerPatient,
    maxDurationMinutes: minutesPerPatient,
    prepMinutes: 0,
    cleanupMinutes: 0,
  };
}

/** ¿El instante cae en un minuto entero? La hora pedida no lleva segundos. */
export function isWholeMinute(instant: Date): boolean {
  return instant.getTime() % 60_000 === 0;
}

/** `YYYY-MM-DD` de un día local, comparable como texto. */
function ymdOfDay(day: LocalDay): string {
  const two = (n: number): string => String(n).padStart(2, '0');
  return `${day.year}-${two(day.month)}-${two(day.day)}`;
}

/** `YYYY-MM-DD` de una columna `date`, que el driver entrega como `Date` o como texto. */
function ymdOfColumn(value: Date | string): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

function validThatDay(
  day: LocalDay,
  validFrom?: Date | string | null,
  validTo?: Date | string | null,
): boolean {
  const ymd = ymdOfDay(day);
  if (validFrom != null && ymd < ymdOfColumn(validFrom)) return false;
  if (validTo != null && ymd > ymdOfColumn(validTo)) return false;
  return true;
}
