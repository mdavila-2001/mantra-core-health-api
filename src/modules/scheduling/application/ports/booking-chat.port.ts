/**
 * Puerto del chat de citas.
 *
 * Cuando el profesional acepta una solicitud, además de la campana el paciente
 * recibe la confirmación en el chat de la app (el hilo directo
 * profesional ↔ paciente). Qué es un hilo y quién es participante es asunto de
 * `community`; la agenda sólo declara **qué** quiere decir.
 *
 * Regla del puerto: **no lanza**. Una cita ya confirmada no puede fallar
 * porque el chat no esté disponible; si falta la vitrina pública de alguna de
 * las dos partes, el adaptador no escribe nada y devuelve `false`.
 */

import type { AuthenticatedUser } from '../../../../common';

/** Emisor de la confirmación de cita en el chat. */
export interface BookingChatPort {
  /**
   * Deja en el hilo profesional ↔ paciente que la cita quedó confirmada.
   *
   * @returns `true` si el mensaje quedó en el hilo.
   */
  announceAcceptance(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean>;
}

/** Token de inyección del chat de citas. */
export const BOOKING_CHAT_PORT = Symbol('BOOKING_CHAT_PORT');
