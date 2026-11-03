/**
 * Puerto de «la atención se completó».
 *
 * Cuando el profesional completa una reserva, otros contextos tienen algo que
 * hacer con ese hecho: hoy, `surveys` emite la encuesta de satisfacción al
 * paciente. Qué hacen y con qué datos es asunto de ellos; la agenda sólo
 * declara **que** pasó.
 *
 * Regla del puerto: **no lanza**. Se invoca después de confirmada la
 * transacción de cierre, así que un fallo del otro contexto no puede deshacer
 * la atención ni convertir el cierre en un error para quien lo hizo: el
 * adaptador registra el fallo y devuelve. Tiene que ser idempotente, porque
 * nada impide que se invoque dos veces para la misma reserva.
 */

import type { AuthenticatedUser } from '../../../../common';

/** Receptor del cierre de una atención. */
export interface BookingCompletedPort {
  /**
   * Avisa que la reserva quedó completada (ya confirmado en la base).
   *
   * @param bookingId - La reserva completada.
   * @param actor - Quien la completó.
   */
  onBookingCompleted(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;
}

/** Token de inyección del receptor del cierre de una atención. */
export const BOOKING_COMPLETED_PORT = Symbol('BOOKING_COMPLETED_PORT');
