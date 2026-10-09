import { touch, type AuthenticatedUser } from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import { BookingDecisionResponseDto } from '../../../presentation/dto';
import { BookingTransitionRecorder } from '../support/booking-transition-recorder';
import { CLIN } from '../../../../clinical/clinical.concepts';
import { ClinicalAppointmentSync } from '../support/clinical-appointment-sync';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';

/** El profesional completa la atención (corrección #15). */
@Injectable()
export class CompleteAppointmentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: BookingAccess,
    private readonly transitions: BookingTransitionRecorder,
    private readonly clinicalSync: ClinicalAppointmentSync,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CompleteAppointmentUseCase.name);
  }

  /**
   * El profesional **completa** la atención (corrección #15).
   *
   * Tampoco valida el reloj: se cierra la que está en curso, sin importar si
   * llegó o no el día agendado. El paciente ve «completada» apenas ocurre —el
   * listado por omisión incluye ese estado, ver {@link VISIBLE_BOOKING_STATES}—
   * sin re-seed ni refresco artificial.
   */
  async execute(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.complete', bookingId },
      'Completing appointment',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.access.loadForOperation(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.transitions.assertTransition(fromState, SCHED.BOOKING_COMPLETED);

      booking.statusConceptId = SCHED.BOOKING_COMPLETED;
      touch(booking, actor.id);
      await this.clinicalSync.syncClinicalAppointment(
        tx,
        booking,
        CLIN.APPOINTMENT_FULFILLED,
        actor,
      );
      await this.transitions.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_COMPLETED,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_COMPLETED,
        occurredAt: new Date().toISOString(),
        // Ídem: completar tampoco desplaza. Ver `accept`.
        desplazadas: [],
      };
    });
  }
}
