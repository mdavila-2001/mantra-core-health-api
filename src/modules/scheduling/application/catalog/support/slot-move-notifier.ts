import { ACTIVE_BOOKING_STATES } from '../../../domain/booking/booking-states';
import {
  AGENDA_NOTICE_PORT,
  type AgendaNoticePort,
} from '../../ports/agenda-notice.port';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  SchedulingCatalogRepository,
  SchedulingNoticeRepository,
} from '../../../infrastructure/repositories';
import { scheduleMovedNotice } from '../../../domain/notices/agenda-notices';

/** Avisa a quienes tenían cita cuando la agenda se corre (P8). */
@Injectable()
export class SlotMoveNotifier {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly noticeRepo: SchedulingNoticeRepository,
    @Inject(AGENDA_NOTICE_PORT)
    private readonly notices: AgendaNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SlotMoveNotifier.name);
  }

  /**
   * Avisa a quien tenía turno en un cupo movido.
   *
   * **Fuera de la transacción**, como el resto de los avisos del módulo: la
   * agenda ya quedó corrida y un fallo del canal no puede deshacerla. Y si
   * fallara la escritura, nadie recibiría un aviso sobre algo que no pasó.
   *
   * Un fallo al avisar no rompe la operación: se registra y sigue. La persona
   * ve el horario nuevo al entrar aunque el mensaje se haya perdido.
   */
  async notifyOfMove(
    slotIds: readonly string[],
    minutes: number,
  ): Promise<number> {
    if (slotIds.length === 0) return 0;

    const em = this.em.fork();
    const bookings = await this.catalogRepo.findBookingsOfSlots(
      em,
      slotIds,
      ACTIVE_BOOKING_STATES,
    );

    let notified = 0;
    for (const booking of bookings) {
      try {
        const snapshot = await this.noticeRepo.describeBooking(em, booking.id);
        if (snapshot === null) continue;
        const account = await this.noticeRepo.findAccountForProfile(
          em,
          booking.patientProfileId,
        );
        if (account === null) continue;

        await this.notices.emit(
          scheduleMovedNotice(snapshot, minutes, account),
        );
        notified += 1;
      } catch (error: unknown) {
        this.logger.warn(
          {
            operation: 'scheduling.slots.shift.notice',
            bookingId: booking.id,
            error,
          },
          'No se pudo avisar del movimiento de horario',
        );
      }
    }
    return notified;
  }
}
