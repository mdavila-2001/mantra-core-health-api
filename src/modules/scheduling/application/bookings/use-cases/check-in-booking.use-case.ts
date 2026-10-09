import {
  CONCEPTS,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { BookingTransitionRecorder } from '../support/booking-transition-recorder';
import { CheckInResponseDto } from '../../../presentation/dto';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** UC-41-10: registra la llegada del paciente. */
@Injectable()
export class CheckInBookingUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly transitions: BookingTransitionRecorder,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CheckInBookingUseCase.name);
  }

  /** UC-41-10: registra la llegada del paciente. */
  async execute(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<CheckInResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.check-in', bookingId },
      'Checking in',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException(
          'Cita no encontrada',
          {
            bookingId,
          },
          SchedulingErrorReason.BOOKING_NOT_FOUND,
        );
      }
      // C-10: la máquina de estados sólo admite check-in desde CONFIRMED.
      const fromState = booking.statusConceptId;
      this.transitions.assertTransition(fromState, CONCEPTS.BOOKING_CHECKED_IN);

      const checkedInAt = new Date();
      booking.statusConceptId = CONCEPTS.BOOKING_CHECKED_IN;
      booking.checkedInAt = checkedInAt;
      touch(booking, actor.id);
      await this.transitions.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: CONCEPTS.BOOKING_CHECKED_IN,
      });

      return { bookingId, checkedInAt: checkedInAt.toISOString() };
    });
  }
}
