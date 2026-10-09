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

/** Los cuatro avisos que el registro del cliente pide (3.4, 3.5, 4.2 y 4.3). */
export type AgendaNoticeKind =
  /** Se liberó un cupo y hay alguien esperándolo (3.4 / 4.3). */
  | 'SLOT_RELEASED'
  /** El profesional informó que se demora (3.5 / 4.2). */
  | 'PRACTITIONER_DELAY'
  /** Falta poco para el turno (recordatorio de 24 h y 2 h). */
  | 'APPOINTMENT_REMINDER'
  /** La cita se aceptó, rechazó, reprogramó o canceló, con su motivo. */
  | 'BOOKING_STATE_CHANGED';

/** A quién va dirigido el aviso. Uno de los dos, no los dos. */
export interface AgendaNoticeRecipient {
  /**
   * Perfil de paciente destinatario. El adaptador resuelve la cuenta que lo
   * encarna; si esa persona no tiene cuenta de portal, el aviso no se entrega
   * (y se registra el motivo).
   */
  readonly patientProfileId?: string;
  /** Cuenta destinataria, cuando ya se conoce (el profesional, por ejemplo). */
  readonly userId?: string;
}

/** Un aviso de agenda listo para emitirse. */
export interface AgendaNotice {
  readonly kind: AgendaNoticeKind;
  readonly recipient: AgendaNoticeRecipient;
  /** Organización del aviso; la bandeja in-app la separa por tenant. */
  readonly tenantId?: string;
  /** Título corto: es lo que se lee en la campana sin abrir nada. */
  readonly subject: string;
  /** Cuerpo con los datos concretos (quién, cuándo, cuántos minutos, motivo). */
  readonly bodyText: string;
  /** Tabla del recurso al que lleva el aviso. */
  readonly relatedResourceType: string;
  /** Identificador de ese recurso. */
  readonly relatedResourceId?: string;
  /**
   * Datos estructurados del aviso, incluido el destino navegable
   * (`payload.route`). La bandeja los devuelve tal cual.
   */
  readonly payload?: Readonly<Record<string, unknown>>;
  /**
   * Clave de rebote: dos avisos con la misma clave no se duplican mientras el
   * primero siga vivo. Es lo que impide que un worker que reintenta un lote
   * llene la campana del paciente con el mismo recordatorio.
   */
  readonly debounceKey?: string;
  /** Quién provoca el aviso; por defecto, la cuenta de servicio del worker. */
  readonly actorUserId?: string;
}

/** Qué pasó con un aviso. Nunca una excepción: emitir no rompe la agenda. */
export interface AgendaNoticeResult {
  /**
   * Si el aviso llegó a la bandeja in-app.
   *
   * Sigue siendo **sólo** el in-app y no un «llegó por algún canal»: es lo que
   * los cuatro puntos de emisión ya interpretan así, y lo que las pruebas
   * existentes fijan. El correo se informa aparte, en {@link emailRequestId}.
   */
  readonly delivered: boolean;
  /** Fila de la bandeja in-app, cuando se entregó. */
  readonly inAppNotificationId?: string;
  /** Solicitud de notificación creada, se haya entregado o no. */
  readonly notificationRequestId?: string;
  /** Por qué no se entregó: sin cuenta, preferencia en contra, canal caído. */
  readonly skippedReason?: string;
  /**
   * Solicitud del canal correo, cuando se encoló.
   *
   * El envío lo hace el worker de mensajería contra el proveedor real, así que
   * acá no hay «entregado»: hay «encolado». La evidencia de que salió es la
   * fila de `messaging.notification_deliveries` con su `provider_message_ref`.
   */
  readonly emailRequestId?: string;
  /** Por qué no se encoló el correo: sin dirección, preferencia en contra. */
  readonly emailSkippedReason?: string;
  /**
   * Si el aviso llegó también al chat de `SupportAdmin` (TAREA-15, punto 1 y
   * 3 del pedido). Ausente para los avisos que esta tarea no manda por chat
   * (cupo liberado, demora, recordatorio) — ver `messaging-agenda-notice.adapter.ts`.
   */
  readonly chatDelivered?: boolean;
  /** Por qué no llegó al chat: sin perfil social, conversación no creada. */
  readonly chatSkippedReason?: string;
}

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
