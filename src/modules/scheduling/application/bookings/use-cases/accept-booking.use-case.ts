import {
  AcceptBookingDto,
  BookingDecisionResponseDto,
} from '../../../presentation/dto';
import { CONCEPTS, touch, type AuthenticatedUser } from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import { BookingTransitionRecorder } from '../support/booking-transition-recorder';
import { CLIN } from '../../../../clinical/clinical.concepts';
import { ClinicalAppointmentSync } from '../support/clinical-appointment-sync';
import {
  DEFAULT_REMINDER_OFFSETS,
  DISPLACED_REASON,
} from '../../../domain/booking/booking-defaults';
import { DisplacedRequestsCanceller } from '../support/displaced-requests-canceller';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { PinoLogger } from 'nestjs-pino';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import { SchedulingProfessionalTimeService } from '../../professional-time/scheduling-professional-time.service';

/** El profesional acepta la solicitud: la cita queda confirmada. */
@Injectable()
export class AcceptBookingUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly access: BookingAccess,
    private readonly transitions: BookingTransitionRecorder,
    private readonly clinicalSync: ClinicalAppointmentSync,
    private readonly displaced: DisplacedRequestsCanceller,
    private readonly notifier: BookingChangeNotifier,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AcceptBookingUseCase.name);
  }

  /**
   * El profesional **acepta** la solicitud: la cita queda confirmada
   * (corrección #11, segundo eslabón del P0).
   *
   * Es la contraparte de {@link requestBooking}. Recién acá hay compromiso, así
   * que recién acá se sella `confirmed_at`, la cita clínica pasa a `booked` y
   * se programan los recordatorios que la solicitud no programó.
   */
  async execute(
    bookingId: string,
    dto: AcceptBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.accept', bookingId },
      'Accepting booking request',
    );

    const result = await this.em.transactional(async (tx) => {
      const booking = await this.access.loadForOperation(tx, bookingId, actor);
      await this.access.assertAffiliationCurrent(booking.tenantId, actor);
      const fromState = booking.statusConceptId;
      this.transitions.assertTransition(fromState, CONCEPTS.BOOKING_CONFIRMED);

      // REGLA MADRE (AG-1): decir «sí» acá compromete el tiempo del
      // profesional, así que hay que mirar TODAS sus agendas antes — no sólo
      // ésta. La propia reserva se excluye: aceptarse no es chocar consigo
      // misma.
      const bookingResource = booking.resourceId
        ? await this.catalogRepo.findResourceById(tx, booking.resourceId)
        : null;
      if (
        bookingResource &&
        PRACTITIONER_PROFILE_TABLES.includes(bookingResource.resourceRefType)
      ) {
        const bookingSlot = await this.bookingsRepo.findSlotById(
          tx,
          booking.bookableSlotId,
        );
        if (bookingSlot) {
          await this.professionalTime.assertRangeFree(
            tx,
            bookingResource.resourceRefId,
            bookingSlot.startAt,
            bookingSlot.endAt ?? bookingSlot.startAt,
            booking.id,
          );
        }
      }

      const confirmedAt = new Date();
      booking.statusConceptId = CONCEPTS.BOOKING_CONFIRMED;
      booking.confirmedAt = confirmedAt;
      touch(booking, actor.id);
      await this.clinicalSync.syncClinicalAppointment(
        tx,
        booking,
        CLIN.APPOINTMENT_BOOKED,
        actor,
      );
      await this.transitions.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: CONCEPTS.BOOKING_CONFIRMED,
        actorKind: 'PROVIDER',
      });

      // Los recordatorios se programan al aceptar y no al solicitar: recordar
      // un turno que todavía podía rechazarse sería prometer lo que nadie
      // comprometió.
      // P8: por omisión, víspera y dos horas antes. Aceptar sin recordatorios
      // dejaba el UC-41-13 dependiendo de que alguien los pidiera a mano, y el
      // registro del cliente pide el recordatorio como comportamiento, no como
      // opción. Un `[]` explícito sigue significando «ninguno».
      const offsets = dto.reminderOffsetsMinutes ?? DEFAULT_REMINDER_OFFSETS;
      const slot =
        offsets.length === 0
          ? null
          : await this.bookingsRepo.findSlotById(tx, booking.bookableSlotId);
      for (const offset of offsets) {
        if (!slot) break;
        this.bookingsRepo.createReminder(tx, {
          bookingId: booking.id,
          channelConceptId: CONCEPTS.REMINDER_CH_SMS,
          offsetMinutes: offset,
          scheduledAt: new Date(slot.startAt.getTime() - offset * 60_000),
          statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
          actorUserId: actor.id,
        });
      }

      // REGLA 2: aceptar una desplaza a las otras que chocan.
      const desplazadas = await this.displaced.cancelConflictingPending(
        tx,
        booking,
        actor,
      );

      return {
        bookingId: booking.id,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
        occurredAt: confirmedAt.toISOString(),
        desplazadas,
      };
    });

    // Fuera de la transacción a propósito (P8): un aviso que falla no puede
    // deshacer una cita que ya se confirmó. Ver `ports/agenda-notice.port.ts`.
    await this.notifier.notifyChange(
      bookingId,
      'ACCEPTED',
      undefined,
      'PROVIDER',
    );
    // Y un aviso por cada solicitud que este «sí» dejó sin efecto: el
    // paciente las pidió y tiene que enterarse de que ya no van, aunque él
    // no haya hecho nada. Uno por uno, porque cada una es de otro médico.
    for (const id of result.desplazadas) {
      await this.notifier.notifyChange(
        id,
        'CANCELLED',
        DISPLACED_REASON,
        'PROVIDER',
      );
    }
    return result;
  }
}
