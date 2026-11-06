import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../../common';
import { AppointmentBookings } from '../../../entities';
import { SCHED } from '../../../domain/scheduling.concepts';
import { isValidBookingTransition } from '../../../domain/booking/booking-state-machine';
import { CompleteAppointmentUseCase } from './complete-appointment.use-case';
import { StartAppointmentUseCase } from './start-appointment.use-case';

/** Qué pasó con la reserva atada a la cita clínica. */
export type LinkedBookingOutcome =
  /** La reserva quedó completada ahora. */
  | 'COMPLETED'
  /** Ya estaba completada: no se toca. */
  | 'ALREADY_COMPLETED'
  /** Su estado no llega a completada (cancelada, ausente, sin confirmar). */
  | 'NOT_COMPLETABLE'
  /** La cita clínica no salió de una reserva de la agenda. */
  | 'NO_BOOKING';

/**
 * Completa la reserva de la agenda cuando se cierra la consulta clínica que la
 * atiende (cierre del encuentro o fin de la teleconsulta).
 *
 * Antes, el único camino a `BOOKING_COMPLETED` era «Completar la cita» de la
 * agenda: quien cerraba la consulta desde la ficha dejaba el turno en curso y
 * el paciente nunca recibía la encuesta. Este caso de uso **no** tiene lógica
 * propia de transición: sigue la máquina de estados y pasa por los mismos casos
 * de uso que la agenda —`StartAppointmentUseCase` si el turno todavía no
 * empezó, y `CompleteAppointmentUseCase`, que dispara `BOOKING_COMPLETED_PORT`
 * (la encuesta)—, con la misma autorización (`loadForOperation`: sólo quien
 * atiende esa agenda o quien opera agendas por oficio).
 *
 * Idempotente: una reserva ya completada se deja como está. Una cancelada, sin
 * presentarse o sin confirmar no se completa: la máquina de estados no lo
 * permite y forzarla sería mentir sobre lo que pasó con el turno.
 */
@Injectable()
export class CompleteLinkedBookingUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly start: StartAppointmentUseCase,
    private readonly complete: CompleteAppointmentUseCase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CompleteLinkedBookingUseCase.name);
  }

  /**
   * @param clinicalAppointmentId - La cita clínica del encuentro cerrado.
   * @param actor - Quien cerró la consulta.
   * @returns Qué se hizo con la reserva.
   */
  async execute(
    clinicalAppointmentId: string,
    actor: AuthenticatedUser,
  ): Promise<LinkedBookingOutcome> {
    // La reserva atada a la cita clínica del encuentro
    // (`appointment_bookings.appointment_id`), sobre la transacción de la
    // petición (RLS).
    const booking = await this.em
      .fork({ keepTransactionContext: true })
      .findOne(AppointmentBookings, { appointmentId: clinicalAppointmentId });
    if (!booking) return 'NO_BOOKING';

    const state = booking.statusConceptId;
    if (state === SCHED.BOOKING_COMPLETED) return 'ALREADY_COMPLETED';

    const canComplete = isValidBookingTransition(
      state,
      SCHED.BOOKING_COMPLETED,
    );
    const canStart =
      !canComplete &&
      isValidBookingTransition(state, SCHED.BOOKING_IN_PROGRESS);
    if (!canComplete && !canStart) {
      this.logger.info(
        {
          operation: 'scheduling.booking.complete_linked',
          bookingId: booking.id,
          statusConceptId: state,
        },
        'Linked booking is not completable',
      );
      return 'NOT_COMPLETABLE';
    }

    // Confirmada o con llegada registrada: se inicia primero, como haría la
    // agenda, para no saltear el estado «en curso» ni su sincronía clínica.
    if (canStart) await this.start.execute(booking.id, actor);
    await this.complete.execute(booking.id, actor);

    this.logger.info(
      {
        operation: 'scheduling.booking.complete_linked',
        bookingId: booking.id,
        started: canStart,
      },
      'Linked booking completed from clinical close',
    );
    return 'COMPLETED';
  }
}
