import type { OrderBookingSnapshot } from '../infrastructure/center-bookings.repository';
import type { OrderAppointmentDto } from '../presentation/dto/order-booking.dto';

/** The wire appointment of a frozen order booking. */
export function appointmentOf(
  bookingId: string,
  startAt: Date,
  endAt: Date,
  s: OrderBookingSnapshot,
): OrderAppointmentDto {
  return {
    bookingId,
    unitId: s.diagnosticUnitId,
    unitName: s.unitName,
    addressText: s.addressText,
    startAt: new Date(startAt).toISOString(),
    endAt: new Date(endAt).toISOString(),
    studyName: s.studyName,
    price: s.price,
    currency: s.currency,
    preparation: s.preparation,
  };
}
