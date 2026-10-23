import { CONCEPTS } from '../../../../common/constants/concepts';
import { SCHED } from '../scheduling.concepts';

const MS_PER_MINUTE = 60_000;

/** Por qué un cupo no se puede retener, en el orden en que se comprueba. */
export type SlotHoldRefusal = 'BLOCKED' | 'RETRACTED' | 'NO_CAPACITY';

/** Por qué un horario no se puede pedir, aunque el cupo tenga lugar. */
export type SlotTimingRefusal = 'ALREADY_PASSED' | 'TOO_CLOSE';

/**
 * ¿El cupo admite una retención?
 *
 * Un cupo retraído lo pisa un servicio que el profesional ya comprometió: se
 * dejó de ofrecer, pero un id leído hace rato todavía puede llegar acá.
 *
 * @returns El motivo del rechazo, o `null` si se puede retener.
 */
export function slotHoldRefusal(slot: {
  statusConceptId: string;
  remainingCapacity: number;
}): SlotHoldRefusal | null {
  if (slot.statusConceptId === CONCEPTS.SLOT_BLOCKED) return 'BLOCKED';
  if (slot.statusConceptId === SCHED.SLOT_RETRACTED) return 'RETRACTED';
  if (slot.remainingCapacity <= 0) return 'NO_CAPACITY';
  return null;
}

/**
 * ¿El horario todavía se puede pedir?
 *
 * Un turno que ya empezó no se puede pedir, aunque le quede capacidad: la
 * agenda dejó de ofrecerlos (A-03) y acá se cierra la puerta directa (A-02).
 * Dos motivos distintos merecen dos frases distintas: a quien pide un turno de
 * la semana pasada no se le habla de anticipación mínima.
 */
export function slotTimingRefusal(
  slotStartAt: Date,
  noticeMinutes: number,
  nowMs: number,
): SlotTimingRefusal | null {
  if (slotStartAt.getTime() <= nowMs) return 'ALREADY_PASSED';
  if (slotStartAt.getTime() <= nowMs + noticeMinutes * MS_PER_MINUTE) {
    return 'TOO_CLOSE';
  }
  return null;
}
