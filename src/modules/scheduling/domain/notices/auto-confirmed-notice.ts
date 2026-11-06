import type { AgendaNotice } from './agenda-notice';
import type { BookingNoticeSnapshot } from './notice-snapshots';
import {
  BOOKING_RESOURCE,
  PRACTITIONER_AGENDA_ROUTE,
  whenText,
} from './agenda-notices';

/**
 * Tells the practitioner that a request was born confirmed (v4.2.88).
 *
 * It is neither the request notice (there is nothing to accept) nor the state
 * change notice (written for the patient). It says where the confirmation came
 * from so nobody looks for who accepted it.
 */
export function autoConfirmedNoticeForPractitioner(
  booking: BookingNoticeSnapshot,
  patient: string | undefined,
  recipientUserId: string,
): AgendaNotice {
  const place =
    booking.siteLabel === undefined ? '' : `, en ${booking.siteLabel}`;
  return {
    kind: 'BOOKING_STATE_CHANGED',
    recipient: { userId: recipientUserId },
    tenantId: booking.tenantId,
    subject: 'Tiene una nueva cita confirmada',
    bodyText:
      `${patient ?? 'Un paciente'} pidió cita para el ${whenText(booking.startAt)}${place} ` +
      'y quedó confirmada sin pasar por su revisión: así lo tiene configurado ' +
      'para esta agenda o este servicio. Puede cambiarlo en Ajustes › Agenda ' +
      'o en «Mis servicios».',
    relatedResourceType: BOOKING_RESOURCE,
    relatedResourceId: booking.bookingId,
    payload: {
      route: PRACTITIONER_AGENDA_ROUTE,
      bookingId: booking.bookingId,
      change: 'ACCEPTED',
      ...(booking.startAt === undefined
        ? {}
        : { startAt: booking.startAt.toISOString() }),
    },
    debounceKey: `p8:booking-auto-confirmed:pro:${booking.bookingId}`,
  };
}
