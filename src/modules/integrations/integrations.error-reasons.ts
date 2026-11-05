/**
 * Catálogo de sub-códigos de negocio estables del módulo `integrations`.
 *
 * `DomainException` ya lleva un `code` genérico (NOT_FOUND, CONFLICT…), común a
 * todo el API. `IntegrationsErrorReason` añade el **cuál** dentro de ese tipo
 * para que un cliente ramifique sobre un valor estable sin parsear `message`.
 */
export enum IntegrationsErrorReason {
  /**
   * La conexión, el mensaje o el callback no existen o su conexión pertenece a
   * otro tenant. Ambos casos responden igual: distinguirlos confirmaría que un
   * UUID existe en otra organización.
   */
  INTEGRATIONS_RESOURCE_NOT_AVAILABLE = 'INTEGRATIONS_RESOURCE_NOT_AVAILABLE',

  /** El `tenantId` del cuerpo no coincide con el tenant activo del actor. */
  INTEGRATIONS_TENANT_MISMATCH = 'INTEGRATIONS_TENANT_MISMATCH',

  /**
   * La conexión no tiene una credencial activa cuya referencia resuelva a un
   * secreto de la bóveda. No se firma ni se verifica con ningún sustituto.
   */
  INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE = 'INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE',

  /** La clave de idempotencia ya la usa un mensaje de otra conexión. */
  INTEGRATIONS_IDEMPOTENCY_KEY_IN_USE = 'INTEGRATIONS_IDEMPOTENCY_KEY_IN_USE',
}
