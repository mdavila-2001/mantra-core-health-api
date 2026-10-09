import { PreconditionFailedException } from '../../../../../common';
import {
  minutesOfDay,
  nextBandStart,
  type DayBand,
} from '../../../domain/catalog/week-bands';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/**
 * Corta si ni el primer turno de la franja puede darse (REQ-10-026).
 *
 * Con el redondeo hacia adelante eso sólo pasa cuando el turno, completo,
 * pisaría la franja siguiente del mismo día.
 */
export function assertFirstSlotFits(
  band: DayBand,
  bands: readonly DayBand[],
  slotMinutes: number,
): void {
  const next = nextBandStart(band, bands);
  if (next === null) return;
  const firstEnd = minutesOfDay(band.startTime) + slotMinutes;
  if (firstEnd > minutesOfDay(next)) {
    throw new PreconditionFailedException(
      `La cita de ${slotMinutes} min que empieza a las ${band.startTime} pisaría la franja de las ${next}`,
      { dayOfWeek: band.dayOfWeek, slotMinutes, siguiente: next },
      SchedulingErrorReason.TEMPLATE_RULE_SLOT_TOO_LONG,
    );
  }
}
