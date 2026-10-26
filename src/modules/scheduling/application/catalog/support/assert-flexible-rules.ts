import { PreconditionFailedException } from '../../../../../common';
import type { ScheduleRuleDto } from '../../../presentation/dto';
import { minutesOfDay } from '../../../domain/catalog/week-bands';

/**
 * Horario flexible (P36): lo que una franja de turnos fijos declara no aplica.
 *
 * Una franja flexible no se corta en turnos, así que la duración por franja, el
 * respiro y la capacidad por turno no tienen a qué referirse. Se rechazan en vez
 * de ignorarse: aceptarlos en silencio haría creer que se guardaron. Y cada
 * franja de consultas tiene que poder recibir al menos una consulta entera: sin
 * redondeo hacia adelante, una franja más corta que el tiempo por paciente no
 * ofrecería ningún horario y se publicaría vacía (REQ-10-026).
 *
 * @param rules - Las franjas que se van a publicar.
 * @param minutesPerPatient - Lo que se reserva por paciente (`slotMinutes` de la plantilla).
 * @throws PreconditionFailedException con la primera franja que no cumple.
 */
export function assertFlexibleRules(
  rules: readonly ScheduleRuleDto[],
  minutesPerPatient: number,
): void {
  for (const rule of rules) {
    if (
      rule.slotMinutes !== undefined ||
      rule.gapMinutes !== undefined ||
      rule.capacityPerSlot !== undefined
    ) {
      throw new PreconditionFailedException(
        'En un horario flexible las franjas no llevan duración, respiro ni capacidad por turno: el tiempo por paciente se declara una sola vez en la plantilla.',
        { dayOfWeek: rule.dayOfWeek },
      );
    }
    if (rule.bookingMode === 'SERVICES') continue;
    const length = minutesOfDay(rule.endTime) - minutesOfDay(rule.startTime);
    if (length > 0 && length < minutesPerPatient) {
      throw new PreconditionFailedException(
        `La franja de las ${rule.startTime} dura menos que el tiempo por paciente (${minutesPerPatient} min): no entraría ninguna consulta.`,
        { dayOfWeek: rule.dayOfWeek, slotMinutes: minutesPerPatient },
      );
    }
  }
}
