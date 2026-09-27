import type {
  MedicationTimingDto,
  MedicationTimingResponseDto,
} from '../dto/medication-timing.dto';
import type { MedicationRequests } from '../entities';
import {
  DEFAULT_MEDICATION_TIME_ZONE,
  type MedicationPeriodUnit,
  type MedicationTiming,
} from './medication-schedule';

/**
 * Las ocho columnas `timing_*` de `clinical.medication_requests` (patch
 * v4.2.35), con los nombres de la entidad.
 */
export interface MedicationTimingColumns {
  timingAsNeeded: boolean;
  timingFrequency?: number;
  timingPeriod?: string;
  timingPeriodUnit?: string;
  timingTimesOfDay?: string[];
  timingStartAt?: Date;
  timingDurationDays?: number;
  timingTimeZone?: string;
}

/**
 * Del cuerpo de la petición a las columnas. Cuando `timing` viaja reemplaza la
 * posología entera: lo que no trae queda vacío, igual que un `frequencyText`
 * reescrito.
 *
 * @param dto - Posología validada por `MedicationTimingDto`.
 * @returns Las columnas a escribir.
 */
export function timingColumnsFromDto(
  dto: MedicationTimingDto,
): MedicationTimingColumns {
  return {
    timingAsNeeded: dto.asNeeded ?? false,
    timingFrequency: dto.frequency,
    timingPeriod: dto.period !== undefined ? String(dto.period) : undefined,
    timingPeriodUnit: dto.periodUnit,
    timingTimesOfDay: dto.timesOfDay ? [...dto.timesOfDay] : undefined,
    timingStartAt: dto.startAt ? new Date(dto.startAt) : undefined,
    timingDurationDays: dto.durationDays,
    timingTimeZone: dto.timeZone,
  };
}

/**
 * Copia la posología de una receta a otra (reemplazo y renovación).
 *
 * @param source - Receta original.
 * @returns Las columnas tal como están en la original.
 */
export function timingColumnsOf(
  source: MedicationRequests,
): MedicationTimingColumns {
  return {
    timingAsNeeded: source.timingAsNeeded ?? false,
    timingFrequency: source.timingFrequency,
    timingPeriod: source.timingPeriod,
    timingPeriodUnit: source.timingPeriodUnit,
    timingTimesOfDay: source.timingTimesOfDay
      ? [...source.timingTimesOfDay]
      : undefined,
    timingStartAt: source.timingStartAt,
    timingDurationDays: source.timingDurationDays,
    timingTimeZone: source.timingTimeZone,
  };
}

/** `true` si la receta declara alguna posología estructurada. */
export function hasStructuredTiming(request: MedicationRequests): boolean {
  return (
    request.timingAsNeeded === true ||
    request.timingFrequency != null ||
    (request.timingTimesOfDay != null && request.timingTimesOfDay.length > 0)
  );
}

/**
 * De las columnas a la posología que entiende el generador de cronograma.
 *
 * @param request - Receta leída de la base.
 * @returns La posología, con nulos convertidos a ausentes.
 */
export function timingOf(request: MedicationRequests): MedicationTiming {
  return {
    asNeeded: request.timingAsNeeded === true,
    frequency: request.timingFrequency ?? undefined,
    period:
      request.timingPeriod != null ? Number(request.timingPeriod) : undefined,
    periodUnit:
      (request.timingPeriodUnit as MedicationPeriodUnit | null) ?? undefined,
    timesOfDay: request.timingTimesOfDay ?? undefined,
    startAt: request.timingStartAt ?? undefined,
    durationDays: request.timingDurationDays ?? undefined,
    timeZone: request.timingTimeZone ?? undefined,
  };
}

/**
 * La posología para el DTO de lectura; `undefined` si la receta no tiene.
 *
 * @param request - Receta leída de la base.
 * @returns El bloque `timing` de la respuesta.
 */
export function timingResponseOf(
  request: MedicationRequests,
): MedicationTimingResponseDto | undefined {
  if (!hasStructuredTiming(request)) return undefined;
  return {
    asNeeded: request.timingAsNeeded === true,
    frequency: request.timingFrequency ?? null,
    period: request.timingPeriod != null ? Number(request.timingPeriod) : null,
    periodUnit:
      (request.timingPeriodUnit as MedicationPeriodUnit | null) ?? null,
    timesOfDay: request.timingTimesOfDay ?? null,
    startAt: request.timingStartAt ?? null,
    durationDays: request.timingDurationDays ?? null,
    timeZone: request.timingTimeZone ?? DEFAULT_MEDICATION_TIME_ZONE,
  };
}
