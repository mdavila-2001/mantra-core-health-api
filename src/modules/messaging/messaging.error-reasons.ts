/**
 * Catálogo de sub-códigos de negocio estables del módulo `messaging`.
 *
 * `DomainException` lleva un `code` genérico HTTP-level (NOT_FOUND,
 * PRECONDITION_FAILED…), común a todo el API; `reason` dice **cuál** error de
 * ese tipo fue. Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum MessagingErrorReason {
  /** El evento de dominio que se quiere repartir no existe. */
  DOMAIN_EVENT_NOT_FOUND = 'DOMAIN_EVENT_NOT_FOUND',
  /** El evento existe pero el relay del outbox todavía no lo publicó. */
  DOMAIN_EVENT_NOT_PUBLISHED = 'DOMAIN_EVENT_NOT_PUBLISHED',
  /** El canal de la solicitud de notificación no existe. */
  MESSAGE_CHANNEL_NOT_FOUND = 'MESSAGE_CHANNEL_NOT_FOUND',
  /**
   * La combinación de destinatario no es admisible: toda solicitud debe
   * identificar a un usuario de la plataforma (`recipientUserId`); una
   * dirección sola no basta porque la solicitud queda ligada a un usuario.
   */
  NOTIFICATION_RECIPIENT_INVALID = 'NOTIFICATION_RECIPIENT_INVALID',
}
