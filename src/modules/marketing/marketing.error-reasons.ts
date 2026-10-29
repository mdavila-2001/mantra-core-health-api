/**
 * Catálogo de sub-códigos de negocio estables del módulo `marketing`.
 *
 * `DomainException` ya lleva un `code` genérico (NOT_FOUND, CONFLICT…), común a
 * todo el API. `MarketingErrorReason` añade el **cuál** dentro de ese tipo para
 * que un cliente ramifique sobre un valor estable sin parsear `message`.
 */
export enum MarketingErrorReason {
  /** El segmento no existe o no pertenece al tenant activo (misma respuesta). */
  SEGMENT_NOT_AVAILABLE = 'MARKETING_SEGMENT_NOT_AVAILABLE',

  /** La campaña no existe o no pertenece al tenant activo (misma respuesta). */
  CAMPAIGN_NOT_AVAILABLE = 'MARKETING_CAMPAIGN_NOT_AVAILABLE',

  /** El journey no existe o no pertenece al tenant activo (misma respuesta). */
  JOURNEY_NOT_AVAILABLE = 'MARKETING_JOURNEY_NOT_AVAILABLE',

  /** La inscripción no existe o su journey no pertenece al tenant activo. */
  ENROLLMENT_NOT_AVAILABLE = 'MARKETING_ENROLLMENT_NOT_AVAILABLE',

  /** La plantilla no existe o no pertenece al tenant activo (misma respuesta). */
  TEMPLATE_NOT_AVAILABLE = 'MARKETING_TEMPLATE_NOT_AVAILABLE',

  /** El enlace rastreable no existe o no pertenece al tenant activo. */
  TRACKED_LINK_NOT_AVAILABLE = 'MARKETING_TRACKED_LINK_NOT_AVAILABLE',

  /** El miembro no es destinatario de la campaña del enlace. */
  RECIPIENT_NOT_AVAILABLE = 'MARKETING_RECIPIENT_NOT_AVAILABLE',

  /** El `tenantId` del cuerpo no coincide con el tenant activo del actor. */
  TENANT_MISMATCH = 'MARKETING_TENANT_MISMATCH',

  /** Ya existe un recurso con ese código en el tenant. */
  CODE_ALREADY_EXISTS = 'MARKETING_CODE_ALREADY_EXISTS',

  /** El token de destinatario del enlace es inválido, está vencido o no es de ese enlace. */
  TRACKED_LINK_TOKEN_INVALID = 'MARKETING_TRACKED_LINK_TOKEN_INVALID',
}
