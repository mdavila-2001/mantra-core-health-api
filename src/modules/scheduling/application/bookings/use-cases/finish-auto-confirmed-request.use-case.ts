import { CONCEPTS, type AuthenticatedUser } from '../../../../../common';
import {
  AGENDA_NOTICE_PORT,
  type AgendaNotice,
  type AgendaNoticePort,
} from '../../ports/agenda-notice.port';
import {
  AUTO_CONFIRMED_REASON,
  DISPLACED_REASON,
} from '../../../domain/booking/booking-defaults';
import { autoConfirmedNoticeForPractitioner } from '../../../domain/notices/auto-confirmed-notice';
import { bookingChangeNotice } from '../../../domain/notices/agenda-notices';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import { BookingTransitionRecorder } from '../support/booking-transition-recorder';
import { DisplacedRequestsCanceller } from '../support/displaced-requests-canceller';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { SCHED } from '../../../domain/scheduling.concepts';
import {
  SchedulingBookingsRepository,
  SchedulingNoticeRepository,
} from '../../../infrastructure/repositories';

/**
 * Completes a patient request that was born confirmed (v4.2.88): the agenda or
 * the service offering does not require approval.
 *
 * It leaves what an acceptance leaves: the history entry (saying it was
 * automatic), the cancellation of the patient's other pending requests at that
 * time (RULE 2) and the notices. Notices go out after the transaction, like
 * every other notice: a failed bell cannot undo a confirmed booking.
 */
@Injectable()
export class FinishAutoConfirmedRequestUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly transitions: BookingTransitionRecorder,
    private readonly displaced: DisplacedRequestsCanceller,
    private readonly noticeRepo: SchedulingNoticeRepository,
    @Inject(AGENDA_NOTICE_PORT)
    private readonly notices: AgendaNoticePort,
    private readonly notifier: BookingChangeNotifier,
  ) {}

  /** @returns When the booking was committed, as the response reports it. */
  async execute(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<string | undefined> {
    const { confirmedAt, displacedIds } = await this.em.transactional(
      async (tx) => {
        const booking = await this.bookingsRepo.findBookingByIdForUpdate(
          tx,
          bookingId,
        );
        if (
          !booking ||
          booking.statusConceptId !== CONCEPTS.BOOKING_CONFIRMED
        ) {
          return { confirmedAt: undefined, displacedIds: [] as string[] };
        }
        await this.transitions.recordTransition(tx, booking, actor, {
          bookingId,
          fromStateConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
          toStateConceptId: CONCEPTS.BOOKING_CONFIRMED,
          reasonText: AUTO_CONFIRMED_REASON,
          actorKind: 'PROVIDER',
        });
        const ids = await this.displaced.cancelConflictingPending(
          tx,
          booking,
          actor,
        );
        return { confirmedAt: booking.confirmedAt, displacedIds: ids };
      },
    );

    await this.announce(bookingId);
    for (const id of displacedIds) {
      await this.notifier.notifyChange(
        id,
        'CANCELLED',
        DISPLACED_REASON,
        'PROVIDER',
      );
    }
    return confirmedAt?.toISOString();
  }

  /** Patient: "your appointment is confirmed". Practitioner: where it came from. */
  private async announce(bookingId: string): Promise<void> {
    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) return;

    const notices: AgendaNotice[] = [
      bookingChangeNotice(booking, 'ACCEPTED', undefined, {
        patientProfileId: booking.patientProfileId,
      }),
    ];
    const practitioner = await this.noticeRepo.findResourceAccount(
      em,
      booking.resourceId,
    );
    // A room or a device has nobody to tell; the patient is told anyway.
    if (practitioner !== null) {
      const patient = await this.noticeRepo.findDisplayNameForProfile(
        em,
        booking.patientProfileId,
      );
      notices.push(
        autoConfirmedNoticeForPractitioner(
          booking,
          patient ?? undefined,
          practitioner,
        ),
      );
    }
    await this.notices.emitMany(notices);
  }
}
