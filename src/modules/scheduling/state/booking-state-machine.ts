import { CONCEPTS } from '../../../common';
import { SCHED } from '../scheduling.concepts';

/**
 * Máquina de estados de una cita (C-10).
 *
 *   REQUESTED → PENDING_CONFIRMATION → CONFIRMED
 *   CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
 *   CONFIRMED → IN_PROGRESS            (sin pasar por el mostrador)
 *   {REQUESTED, PENDING_CONFIRMATION, CONFIRMED, CHECKED_IN} → CANCELLED
 *   {CONFIRMED, CHECKED_IN} → NO_SHOW
 *
 * ## Por qué CONFIRMED → IN_PROGRESS existe (corrección #15)
 *
 * El check-in es el registro de que alguien **llegó al mostrador**, y hay
 * atenciones donde no hay mostrador: la teleconsulta, el consultorio de una
 * persona sola, la cita que el profesional decide atender antes. Exigir el paso
 * intermedio convertía a un trámite administrativo en requisito para atender.
 *
 * Sigue habiendo una sola forma de completar —desde EN_CURSO— y una sola de
 * empezar —desde una cita confirmada, con o sin llegada registrada—. Lo que no
 * hay, y es deliberado, es **validación de reloj**: ni empezar ni cerrar
 * comprueban que llegó el día agendado.
 *
 * La reprogramación NO es una transición de estado: se modela como evento/relación
 * (`booking_reschedules`) sin sobrescribir la reserva original, por lo que la cita
 * permanece CONFIRMED tras reprogramarse. COMPLETED, CANCELLED y NO_SHOW son
 * estados terminales.
 *
 * El grafo se declara sobre concept-ids (los estados nuevos salen del catálogo
 * local `SCHED`; los preexistentes, del catálogo central `CONCEPTS`).
 */
export const BOOKING_TRANSITIONS: Readonly<Record<string, readonly string[]>> =
  {
    [SCHED.BOOKING_REQUESTED]: [
      SCHED.BOOKING_PENDING_CONFIRMATION,
      CONCEPTS.BOOKING_CONFIRMED,
      CONCEPTS.BOOKING_CANCELLED,
    ],
    [SCHED.BOOKING_PENDING_CONFIRMATION]: [
      CONCEPTS.BOOKING_CONFIRMED,
      CONCEPTS.BOOKING_CANCELLED,
    ],
    [CONCEPTS.BOOKING_CONFIRMED]: [
      CONCEPTS.BOOKING_CHECKED_IN,
      // Corrección #15: se puede empezar sin registrar llegada.
      SCHED.BOOKING_IN_PROGRESS,
      CONCEPTS.BOOKING_CANCELLED,
      SCHED.BOOKING_NO_SHOW,
    ],
    [CONCEPTS.BOOKING_CHECKED_IN]: [
      SCHED.BOOKING_IN_PROGRESS,
      CONCEPTS.BOOKING_CANCELLED,
      SCHED.BOOKING_NO_SHOW,
    ],
    [SCHED.BOOKING_IN_PROGRESS]: [SCHED.BOOKING_COMPLETED],
    // Terminales: sin salidas.
    [SCHED.BOOKING_COMPLETED]: [],
    [CONCEPTS.BOOKING_CANCELLED]: [],
    [SCHED.BOOKING_NO_SHOW]: [],
  };

/** ¿Es válida la transición `from → to` según la máquina de estados? */
export function isValidBookingTransition(from: string, to: string): boolean {
  if (from === to) return false;
  return (BOOKING_TRANSITIONS[from] ?? []).includes(to);
}
