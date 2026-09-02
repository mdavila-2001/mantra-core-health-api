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
 * (1b) Entró una solicitud de turno — el aviso para **el profesional**.
 *
 * Hasta acá pedir un turno era un hecho silencioso: `requestBooking` dejaba la
 * cita en `PENDING_CONFIRMATION` y no avisaba a nadie. El profesional se
 * enteraba sólo si abría la agenda, y el paciente no tenía forma de saber si su
 * pedido había entrado.
 *
 * Lleva la acción en el cuerpo —aceptar o rechazar— porque una solicitud que
 * avisa sin decir qué se espera de quien la recibe es sólo ruido.
 *
 * ## Lo que este aviso todavía no dice
 *
 * El propietario lo pide «en tal horario **en tal lugar**». El horario está; el
 * lugar **no viaja en el snapshot de la cita**. Resolverlo es cruzar a
 * `practice` (`PractitionerSitesService`) y exponer la sede en la lectura de
 * agenda, que es alcance de TAREA-12 §3.2 y toca la regla 00.4. No se inventa
 * acá: cuando esa lectura exista, este texto gana una frase.
 *
 * @param booking - La cita recién solicitada.
 * @param paciente - Cómo se llama quien la pidió; `undefined` si no se resolvió.
 * @param destinatarioUserId - Cuenta del profesional.
 */
export function avisoDeSolicitudAlProfesional(
  booking: BookingNoticeSnapshot,
  paciente: string | undefined,
  destinatarioUserId: string,
): AgendaNotice {
  const quien = paciente ?? 'Un paciente';
  return {
    kind: 'BOOKING_STATE_CHANGED',
    recipient: { userId: destinatarioUserId },
    tenantId: booking.tenantId,
    subject: 'Tenés una nueva solicitud de consulta',
    bodyText:
      `${quien} pidió turno para el ${cuando(booking.startAt)}. ` +
      'Aceptala o rechazala desde tu agenda.',
    relatedResourceType: RECURSO_CITA,
    relatedResourceId: booking.bookingId,
    payload: {
      route: rutaDelTurno(booking.bookingId),
      bookingId: booking.bookingId,
      change: 'REQUESTED',
      ...(booking.startAt === undefined
        ? {}
        : { startAt: booking.startAt.toISOString() }),
    },
    // Reintentar la materialización de la misma reserva no puede llenarle la
    // campana al profesional con la misma solicitud.
    debounceKey: `p8:booking-requested:pro:${booking.bookingId}`,
  };
}

/**
 * (1c) Entró una solicitud de turno — el acuse para **el paciente**.
 *
 * Es el punto 2 del pedido y el AC-15-2: los dos destinatarios, no uno. Sin
 * este acuse, pedir un turno se siente como escribir a un buzón sin fondo —el
 * paciente no sabe si el pedido entró, y vuelve a pedirlo.
 *
 * Dice explícitamente que **falta la respuesta**: un acuse que se lee como
 * confirmación es peor que ningún acuse, porque manda a alguien al consultorio
 * con un turno que nadie tomó.
 *
 * @param booking - La cita recién solicitada.
 */
export function avisoDeSolicitudAlPaciente(
  booking: BookingNoticeSnapshot,
): AgendaNotice {
  return {
    kind: 'BOOKING_STATE_CHANGED',
    recipient: { patientProfileId: booking.patientProfileId },
    tenantId: booking.tenantId,
    subject: 'Enviamos tu solicitud de turno',
    bodyText:
      `Pediste turno con ${booking.resourceLabel} para el ${cuando(booking.startAt)}. ` +
      'Todavía falta que lo confirmen: te avisamos apenas respondan.',
    relatedResourceType: RECURSO_CITA,
    relatedResourceId: booking.bookingId,
    payload: {
      route: rutaDelTurno(booking.bookingId),
      bookingId: booking.bookingId,
      change: 'REQUESTED',
      ...(booking.startAt === undefined
        ? {}
        : { startAt: booking.startAt.toISOString() }),
    },
    debounceKey: `p8:booking-requested:pac:${booking.bookingId}`,
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
  'ACCEPTED' | 'ASSIGNED' | 'REJECTED' | 'RESCHEDULED' | 'CANCELLED';

/** Encabezado de cada cambio, en la voz de quien lo recibe. */
const TITULO: Readonly<Record<CambioDeCita, string>> = {
  ACCEPTED: 'Tu turno quedó confirmado',
  // La cita puntual (AG-2): el doctor la asigna y el paciente SE ENTERA — no
  // confirma, porque ya se acordó en el consultorio.
  ASSIGNED: 'Te agendaron un turno',
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
    ASSIGNED: `${booking.resourceLabel} te agendó para el ${cuando(booking.startAt)}. Si no podés asistir, pedí el cambio desde tus turnos.`,
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
