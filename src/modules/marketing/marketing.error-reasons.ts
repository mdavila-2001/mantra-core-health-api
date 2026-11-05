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

  /** La ventana de una lectura de Insights es inválida (fecha, vacía o mayor de 92 días). */
  INSIGHTS_WINDOW_INVALID = 'MARKETING_INSIGHTS_WINDOW_INVALID',

  /** La lectura de hechos de Insights devolvería más filas que el máximo; hay que acotarla. */
  INSIGHTS_FACTS_LIMIT_EXCEEDED = 'MARKETING_INSIGHTS_FACTS_LIMIT_EXCEEDED',

  /** `If-Match` no coincide con la `row_version` actual (o la fila ya existe y no vino): 412. */
  INSIGHTS_VERSION_MISMATCH = 'MARKETING_INSIGHTS_VERSION_MISMATCH',

  /** Falta `If-Match` en una modificación que lo exige (reglas de alerta): 428. */
  INSIGHTS_IF_MATCH_REQUIRED = 'MARKETING_INSIGHTS_IF_MATCH_REQUIRED',

  /** El umbral de una regla de alerta está fuera de 1 a 500. */
  INSIGHTS_RULE_THRESHOLD_OUT_OF_RANGE = 'MARKETING_INSIGHTS_RULE_THRESHOLD_OUT_OF_RANGE',

  /** La regla de alerta no existe. */
  INSIGHTS_RULE_NOT_FOUND = 'MARKETING_INSIGHTS_RULE_NOT_FOUND',

  /** Ya hay una vista guardada con ese nombre para el usuario. */
  INSIGHTS_VIEW_NAME_TAKEN = 'MARKETING_INSIGHTS_VIEW_NAME_TAKEN',

  /** El recurso del usuario no existe o es de otro usuario (misma respuesta). */
  INSIGHTS_RESOURCE_NOT_AVAILABLE = 'MARKETING_INSIGHTS_RESOURCE_NOT_AVAILABLE',

  /** El `fingerprint` de una alerta está vacío o supera 200 caracteres. */
  INSIGHTS_FINGERPRINT_INVALID = 'MARKETING_INSIGHTS_FINGERPRINT_INVALID',

  /** El cuerpo no cambia nada o es incoherente (periodo invertido, PATCH vacío). */
  INSIGHTS_BODY_INVALID = 'MARKETING_INSIGHTS_BODY_INVALID',
}
