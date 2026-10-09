import { Injectable } from '@nestjs/common';
import { HistoryRepository } from '../../../audit/repositories';
import type {
  BookingHistoryEntry,
  BookingHistoryPort,
  BookingHistoryRevision,
} from '../../application/ports/booking-history.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** La tabla de historial donde `audit` versiona las citas. */
const BOOKINGS_HISTORY_ENTITY = 'appointment_bookings';

/** Implementa el historial de citas sobre el repositorio de `audit`. */
@Injectable()
export class AuditBookingHistoryAdapter implements BookingHistoryPort {
  constructor(private readonly history: HistoryRepository) {}

  async append(
    uow: UnitOfWork,
    bookingId: string,
    entry: BookingHistoryEntry,
  ): Promise<void> {
    await this.history.append(uow, BOOKINGS_HISTORY_ENTITY, bookingId, entry);
  }

  latestByBooking(
    uow: UnitOfWork,
    bookingIds: readonly string[],
    matches?: (revision: BookingHistoryRevision) => boolean,
  ): Promise<Map<string, BookingHistoryRevision>> {
    return this.history.latestBySource(
      uow,
      BOOKINGS_HISTORY_ENTITY,
      bookingIds,
      matches,
    );
  }
}
