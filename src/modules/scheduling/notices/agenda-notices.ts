import type { AgendaNotice } from '../ports/agenda-notice.port';
import type {
  BookingNoticeSnapshot,
  SlotNoticeSnapshot,
} from '../repositories/scheduling-notice.repository';

/**
 * Redacción de los cuatro avisos de agenda (P8).
 *
 * Son funciones puras y viven aparte de los servicios por dos razones:
 * probar el texto exacto que lee un paciente no debería exigir una base de
 * datos, y **el texto es el entregable**. «Se liberó un horario» sin decir con
 * quién ni cuándo obliga a abrir la app para averiguar qué se liberó, que es
 * justamente lo que el aviso venía a evitar.
 *
 * Las fechas se formatean en español y en la zona del servidor. Cuando el
 * recurso declare `time_zone` —la columna existe— este es el único lugar que
 * hay que cambiar.
 */

/** Tabla a la que apunta un aviso de cita. */
export const RECURSO_CITA = 'scheduling.appointment_bookings';

/** Tabla a la que apunta un aviso de cupo liberado. */
export const RECURSO_CUPO = 'scheduling.bookable_slots';

/**
 * Ruta del portal donde el paciente ve sus turnos.
 *
 * Se declara acá y viaja en el payload porque un aviso que no lleva a ninguna
 * parte obliga a buscar a mano lo que acaba de avisar. El front la consume tal
 * cual; si la ruta cambia, cambia en un solo sitio.
 */
export const RUTA_MIS_TURNOS = '/my-account/appointments';

/** El destino navegable de un aviso sobre una cita concreta. */
export function rutaDelTurno(bookingId: string): string {
  return `${RUTA_MIS_TURNOS}?turno=${bookingId}`;
}

/** Fecha larga con hora: «lunes 18 de agosto a las 09:30». */
export function cuando(fecha: Date | undefined): string {
  if (!fecha) return 'una fecha por confirmar';
  return new Intl.DateTimeFormat('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha);
}

/** Sólo la hora: «09:30». */
export function hora(fecha: Date | undefined): string {
  if (!fecha) return 'la hora indicada';
  return new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha);
}

/**
 * (1) Se liberó un cupo para quien está en lista de espera.
 *
 * Lleva hora límite —el cupo es de quien lo confirme primero— porque un aviso
 * que no dice cuánto dura convierte una oportunidad en una carrera a ciegas.
 */
export function avisoDeCupoLiberado(
  slot: SlotNoticeSnapshot,
  patientProfileId: string,
  tenantId: string,
): AgendaNotice {
  return {
    kind: 'SLOT_RELEASED',
    recipient: { patientProfileId },
    tenantId,
    subject: 'Se liberó un horario que estabas esperando',
    bodyText:
      `Se liberó un horario con ${slot.resourceLabel} el ${cuando(slot.startAt)}. ` +
      'Reservalo desde «Mis turnos» antes de que lo tome otra persona.',
    relatedResourceType: RECURSO_CUPO,
    relatedResourceId: slot.slotId,
    payload: {
      route: RUTA_MIS_TURNOS,
      slotId: slot.slotId,
      resourceId: slot.resourceId,
      startAt: slot.startAt.toISOString(),
    },
    // Un worker que reintenta el mismo lote no puede avisar dos veces del
    // mismo cupo a la misma persona.
    debounceKey: `p8:slot-released:${slot.slotId}:${patientProfileId}`,
  };
}

/**
 * (2) El profesional se demora.
 *
 * Dice los minutos y, si lo hay, lo que el profesional escribió. Sin los
 * minutos el aviso no sirve para decidir si salir de casa, que es la única
 * decisión que habilita.
 */
export function avisoDeDemora(
  booking: BookingNoticeSnapshot,
  minutos: number,
  mensaje: string | undefined,
): AgendaNotice {
  const nuevaHora =
    booking.startAt === undefined
      ? undefined
      : new Date(booking.startAt.getTime() + minutos * 60_000);

  return {
    kind: 'PRACTITIONER_DELAY',
    recipient: { patientProfileId: booking.patientProfileId },
    tenantId: booking.tenantId,
    subject: `${booking.resourceLabel} se demora ${minutos} minutos`,
    bodyText:
      `Tu turno de las ${hora(booking.startAt)} con ${booking.resourceLabel} ` +
      `se atrasa unos ${minutos} minutos` +
      (nuevaHora === undefined
        ? '. '
        : `: se estima para las ${hora(nuevaHora)}. `) +
      (mensaje === undefined || mensaje.trim() === ''
        ? 'Podés ver el detalle en «Mis turnos».'
        : mensaje.trim()),
    relatedResourceType: RECURSO_CITA,
    relatedResourceId: booking.bookingId,
    payload: {
      route: rutaDelTurno(booking.bookingId),
      bookingId: booking.bookingId,
      delayMinutes: minutos,
      ...(mensaje === undefined ? {} : { message: mensaje }),
      ...(nuevaHora === undefined
        ? {}
        : { estimatedStartAt: nuevaHora.toISOString() }),
    },
  };
}

/**
 * (3) Recordatorio de cita.
 *
 * El texto cambia con la antelación: «mañana» y «en un rato» no son la misma
 * frase, y usar una sola obligaría a leer la fecha para saber cuál de las dos
 * es.
 */
export function avisoDeRecordatorio(
  booking: BookingNoticeSnapshot,
  offsetMinutes: number,
): AgendaNotice {
  const esVispera = offsetMinutes >= 12 * 60;
  return {
    kind: 'APPOINTMENT_REMINDER',
    recipient: { patientProfileId: booking.patientProfileId },
    tenantId: booking.tenantId,
    subject: esVispera ? 'Mañana tenés turno' : 'Tu turno es hoy',
    bodyText: esVispera
      ? `Mañana ${cuando(booking.startAt)} tenés turno con ${booking.resourceLabel}.`
      : `Hoy a las ${hora(booking.startAt)} tenés turno con ${booking.resourceLabel}.`,
    relatedResourceType: RECURSO_CITA,
    relatedResourceId: booking.bookingId,
    payload: {
      route: rutaDelTurno(booking.bookingId),
      bookingId: booking.bookingId,
      offsetMinutes,
      ...(booking.startAt === undefined
        ? {}
        : { startAt: booking.startAt.toISOString() }),
    },
    // Un recordatorio es único por cita y antelación: si el worker repite el
    // lote, la persona no recibe el mismo aviso dos veces.
    debounceKey: `p8:reminder:${booking.bookingId}:${offsetMinutes}`,
  };
}

/** Los cambios de estado que el paciente tiene que enterarse. */
export type CambioDeCita =
  'ACCEPTED' | 'REJECTED' | 'RESCHEDULED' | 'CANCELLED';

/** Encabezado de cada cambio, en la voz de quien lo recibe. */
const TITULO: Readonly<Record<CambioDeCita, string>> = {
  ACCEPTED: 'Tu turno quedó confirmado',
  REJECTED: 'No se pudo tomar tu solicitud de turno',
  RESCHEDULED: 'Tu turno se movió de horario',
  CANCELLED: 'Tu turno se canceló',
};

/**
 * (4) Cambio de estado de la cita, **con el motivo**.
 *
 * El motivo va en el cuerpo y no sólo en el detalle: un aviso que dice
 * «cancelada» y obliga a abrir la app para saber por qué es media noticia.
 *
 * @param destinatario - A quién se avisa. Cuando el paciente cancela, el que
 * necesita enterarse es el profesional, y entonces llega su cuenta y no un
 * perfil de paciente.
 */
export function avisoDeCambioDeCita(
  booking: BookingNoticeSnapshot,
  cambio: CambioDeCita,
  motivo: string | undefined,
  destinatario: { patientProfileId?: string; userId?: string },
): AgendaNotice {
  const conQuien = `con ${booking.resourceLabel}`;
  const cuerpo: Readonly<Record<CambioDeCita, string>> = {
    ACCEPTED: `Tu turno ${conQuien} del ${cuando(booking.startAt)} quedó confirmado.`,
    REJECTED: `Tu solicitud de turno ${conQuien} del ${cuando(booking.startAt)} no se pudo tomar.`,
    RESCHEDULED: `Tu turno ${conQuien} pasó al ${cuando(booking.startAt)}.`,
    CANCELLED: `Se canceló tu turno ${conQuien} del ${cuando(booking.startAt)}.`,
  };

  return {
    kind: 'BOOKING_STATE_CHANGED',
    recipient: destinatario,
    tenantId: booking.tenantId,
    subject: TITULO[cambio],
    bodyText:
      cuerpo[cambio] +
      (motivo === undefined || motivo.trim() === ''
        ? ''
        : ` Motivo: ${motivo.trim()}`),
    relatedResourceType: RECURSO_CITA,
    relatedResourceId: booking.bookingId,
    payload: {
      route: rutaDelTurno(booking.bookingId),
      bookingId: booking.bookingId,
      change: cambio,
      ...(motivo === undefined ? {} : { reasonText: motivo }),
      ...(booking.startAt === undefined
        ? {}
        : { startAt: booking.startAt.toISOString() }),
    },
  };
}
