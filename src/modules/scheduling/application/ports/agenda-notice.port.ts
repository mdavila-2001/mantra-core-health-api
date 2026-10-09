/**
 * Puerto de emisión de los avisos de agenda (carril P8).
 *
 * ## Por qué existe un puerto y no una llamada directa a mensajería
 *
 * El canal in-app —la campana, el centro de notificaciones y el «marcar
 * leído»— es el entregable del carril **P1**, que publica su contrato de
 * emisión aparte. P8 no puede esperarlo y tampoco puede inventar un segundo
 * canal: lo que hace es declarar **qué** avisa, con esta interfaz local, y
 * dejar el **cómo** detrás de un adaptador reemplazable.
 *
 * Cuando P1 publique su servicio de emisión, la migración es sustituir el
 * proveedor de {@link AGENDA_NOTICE_PORT} en `scheduling.module.ts` por un
 * adaptador que delegue en él. Ningún caso de uso de agenda cambia: los cuatro
 * avisos ya están emitidos contra esta forma.
 *
 * ## Reglas que el puerto impone a cualquier implementación
 *
 * 1. **Emitir no puede romper la agenda.** Un aviso que falla se registra y se
 *    descarta; jamás revierte la reserva, la cancelación ni la promoción que lo
 *    originó. Por eso los servicios lo invocan *después* de confirmar su
 *    transacción y nunca dentro de ella.
 * 2. **El aviso es navegable.** Todo aviso lleva el recurso relacionado
 *    (`relatedResourceType`/`relatedResourceId`) y un destino en el payload,
 *    porque un aviso que no lleva a ninguna parte obliga a buscar a mano lo que
 *    acaba de avisar.
 * 3. **El destinatario se nombra por perfil, no por cuenta.** La agenda conoce
 *    perfiles de paciente; resolver qué cuenta los encarna es trabajo del
 *    adaptador, y hacerlo acá obligaría a cada caso de uso a saberlo.
 */

import type {
  AgendaNotice,
  AgendaNoticeKind,
  AgendaNoticeRecipient,
  AgendaNoticeResult,
} from '../../domain/notices/agenda-notice';

export type {
  AgendaNotice,
  AgendaNoticeKind,
  AgendaNoticeRecipient,
  AgendaNoticeResult,
};

/** Emisor de avisos de agenda. */
export interface AgendaNoticePort {
  /**
   * Emite un aviso. **No lanza**: los fallos vuelven como
   * `{ delivered: false, skippedReason }`.
   */
  emit(notice: AgendaNotice): Promise<AgendaNoticeResult>;

  /** Emite un lote. Un aviso que falla no cancela los demás. */
  emitMany(notices: readonly AgendaNotice[]): Promise<AgendaNoticeResult[]>;
}

/** Token de inyección del emisor de avisos. */
export const AGENDA_NOTICE_PORT = Symbol('AGENDA_NOTICE_PORT');
