import type { AgendaNotice } from './agenda-notice';
import { appointmentRoute } from './agenda-notices';

/**
 * Redacción de los avisos de agenda **para el chat** de la app.
 *
 * La campana y el correo llevan el texto sobrio de `agenda-notices.ts`. El chat
 * es otra cosa: se lee como una conversación, junto a mensajes de personas, y
 * un párrafo plano se pierde entre ellos. Acá el mismo aviso sale con:
 *
 * - un **encabezado con emoji** que dice qué pasó antes de leer la frase
 *   (✅ confirmada, ⏳ demora, 🚫 cancelada…);
 * - el cuerpo del aviso, tal cual —es el que ya dice quién, cuándo y por qué—;
 * - una **línea con el enlace a la cita**. El frontend la reconoce por el
 *   parámetro `turno=` y la pinta como botón «Ir a la cita», enviando a cada
 *   lado a su pantalla (el paciente a «Mis citas», el profesional a su
 *   agenda). Quien lea el chat desde otro cliente ve un enlace que funciona.
 *
 * Son funciones puras por la misma razón que los redactores de la campana: el
 * texto es el entregable y probarlo no debería exigir una base de datos.
 */

/** Parámetro que marca un enlace como «ir a la cita». El frontend lo busca. */
export const BOOKING_LINK_PARAM = 'turno';

/** Encabezado de cada aviso, según su tipo y, si lo hay, el cambio. */
const HEADER: Readonly<Record<string, string>> = {
  ACCEPTED: '✅ ¡Cita confirmada!',
  ASSIGNED: '📅 Tiene una nueva cita agendada',
  REJECTED: '😔 No pudimos tomar su solicitud',
  RESCHEDULED: '🔄 Su cita cambió de horario',
  CANCELLED: '🚫 Cita cancelada',
  REQUESTED: '📩 Solicitud de cita recibida',
  SHIFTED: '⏰ Se movió el horario de su cita',
  PRACTITIONER_DELAY: '⏳ Aviso de demora',
  APPOINTMENT_REMINDER: '🔔 Recordatorio de cita',
  SLOT_RELEASED: '🎉 ¡Se liberó un horario!',
};

/** Cierre amable de cada aviso: lo que la persona puede hacer ahora. */
const CLOSING: Readonly<Record<string, string>> = {
  ACCEPTED: '¡Lo esperamos! 💙',
  ASSIGNED: 'Si no puede asistir, avísenos desde la app. 🙌',
  REJECTED: 'Puede pedir otro horario cuando quiera. 💬',
  RESCHEDULED: 'Si el nuevo horario no le sirve, pida otro desde la app. 🙌',
  CANCELLED: 'Cuando quiera, puede agendar una nueva cita. 💙',
  SHIFTED: 'Si no le sirve, puede pedir otro horario desde la app. 🙌',
  PRACTITIONER_DELAY: 'Gracias por su paciencia. 🙏',
  APPOINTMENT_REMINDER: '¡Nos vemos pronto! 💙',
  SLOT_RELEASED: '¡Resérvelo antes de que lo tome otra persona! ⚡',
};

/** La clave de las tablas: el cambio, si el aviso lo declara; si no, el tipo. */
function keyOf(notice: AgendaNotice): string {
  const change = notice.payload?.['change'];
  return typeof change === 'string' && change in HEADER ? change : notice.kind;
}

/**
 * El enlace absoluto a la cita del aviso, o `undefined` si no apunta a una.
 *
 * Parte de la ruta que el aviso ya declara para su destinatario y le agrega
 * `turno=<id>` si no lo trae: así el profesional sigue cayendo en su agenda y
 * el botón del chat igual sabe de qué cita se trata.
 */
export function bookingLinkFor(
  notice: AgendaNotice,
  webAppBaseUrl: string,
): string | undefined {
  const bookingId = notice.payload?.['bookingId'];
  if (typeof bookingId !== 'string' || bookingId === '') return undefined;
  const declared = notice.payload?.['route'];
  const route =
    typeof declared === 'string' && declared.startsWith('/')
      ? declared
      : appointmentRoute(bookingId);
  const withBooking = route.includes(`${BOOKING_LINK_PARAM}=`)
    ? route
    : `${route}${route.includes('?') ? '&' : '?'}${BOOKING_LINK_PARAM}=${bookingId}`;
  return `${webAppBaseUrl}${withBooking}`;
}

/** Arma el mensaje: encabezado, cuerpo, cierre y enlace. */
function compose(
  header: string,
  body: string,
  closing: string | undefined,
  link: string | undefined,
): string {
  return [
    header,
    body.trim(),
    ...(closing === undefined ? [] : [closing]),
    ...(link === undefined ? [] : [`👉 Ver la cita: ${link}`]),
  ].join('\n\n');
}

/** El texto de un aviso de agenda tal como se escribe en el chat. */
export function chatTextForNotice(
  notice: AgendaNotice,
  webAppBaseUrl: string,
): string {
  const key = keyOf(notice);
  return compose(
    HEADER[key] ?? `📣 ${notice.subject}`,
    notice.bodyText,
    CLOSING[key],
    bookingLinkFor(notice, webAppBaseUrl),
  );
}

/** Lo que hace falta para confirmar una cita en el hilo profesional ↔ paciente. */
export interface BookingConfirmationChat {
  readonly bookingId: string;
  readonly resourceLabel: string;
  /** Fecha ya redactada: «viernes, 30 de octubre de 2026, 9:35 a. m.». */
  readonly when: string;
  readonly siteLabel?: string;
}

/**
 * La confirmación que el profesional deja en el hilo directo con su paciente.
 *
 * Es la voz del profesional (el mensaje sale firmado por su vitrina), por eso
 * habla en primera persona del plural de la consulta y no de «la app».
 */
export function bookingConfirmationChatText(
  cita: BookingConfirmationChat,
  webAppBaseUrl: string,
): string {
  const lines = [
    `🗓️ ${cita.when}`,
    `👩‍⚕️ ${cita.resourceLabel}`,
    ...(cita.siteLabel === undefined || cita.siteLabel.trim() === ''
      ? []
      : [`📍 ${cita.siteLabel.trim()}`]),
  ];
  return compose(
    '✅ ¡Su cita quedó confirmada!',
    lines.join('\n'),
    '⏰ Le recomendamos llegar 10 minutos antes. ¡Lo esperamos! 💙',
    `${webAppBaseUrl}${appointmentRoute(cita.bookingId)}`,
  );
}
