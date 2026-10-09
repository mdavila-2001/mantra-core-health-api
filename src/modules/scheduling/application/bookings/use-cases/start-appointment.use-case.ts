import type { AppointmentBookings } from '../../../entities';
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

/** El profesional inicia la atención (corrección #15). */
@Injectable()
export class StartAppointmentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: BookingAccess,
    private readonly transitions: BookingTransitionRecorder,
    private readonly clinicalSync: ClinicalAppointmentSync,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StartAppointmentUseCase.name);
  }

  /**
   * El profesional **inicia** la atención (corrección #15).
   *
   * **Sin validación de reloj, y es lo importante**: una cita confirmada se
   * puede empezar en cualquier momento. Las únicas comprobaciones son de estado
   * —solo se inicia una confirmada o con llegada registrada— y de actor —solo
   * quien atiende esa agenda—. Nunca de fecha.
   */
  async execute(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.start', bookingId },
      'Starting appointment',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.access.loadForOperation(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.transitions.assertTransition(fromState, SCHED.BOOKING_IN_PROGRESS);

      booking.statusConceptId = SCHED.BOOKING_IN_PROGRESS;
      touch(booking, actor.id);
      await this.clinicalSync.syncClinicalAppointment(
        tx,
        booking,
        CLIN.APPOINTMENT_CHECKED_IN,
        actor,
      );
      await this.transitions.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_IN_PROGRESS,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_IN_PROGRESS,
        occurredAt: new Date().toISOString(),
        // Empezar la atención no desplaza nada: la regla 2 es de `accept`.
        desplazadas: [],
      };
    });
  }

  /**
   * El cuerpo transaccional de {@link start}, para casos de uso que ya
   * cargaron la reserva y abrieron su propia transacción — el paso final del
   * mostrador atómico (AC-3.3), que confirma y arranca en el mismo `tx`.
   *
   * No vuelve a cargar la reserva: el llamador ya la tiene (acaba de
   * confirmarla), así que evita un `SELECT` redundante.
   *
   * @param tx - Contexto transaccional ya abierto por el llamador.
   * @param booking - La reserva recién confirmada, en estado `CONFIRMED`.
   * @param actor - Quien opera.
   */
  async executeInTransaction(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const fromState = booking.statusConceptId;
    this.transitions.assertTransition(fromState, SCHED.BOOKING_IN_PROGRESS);

    booking.statusConceptId = SCHED.BOOKING_IN_PROGRESS;
    touch(booking, actor.id);
    await this.clinicalSync.syncClinicalAppointment(
      tx,
      booking,
      CLIN.APPOINTMENT_CHECKED_IN,
      actor,
    );
    await this.transitions.recordTransition(tx, booking, actor, {
      bookingId: booking.id,
      fromStateConceptId: fromState,
      toStateConceptId: SCHED.BOOKING_IN_PROGRESS,
      actorKind: 'PROVIDER',
    });
  }
}
