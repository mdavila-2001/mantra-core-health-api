/**
 * Sub-códigos de negocio estables para los errores de dominio de `tracking`.
 * Van como `reason` de `DomainException` (y subclases), encima del `code`
 * genérico (NOT_FOUND, FORBIDDEN, ...) que ya fija el status HTTP.
 *
 * Los `*_NOT_FOUND` se lanzan igual para un UUID inexistente que para uno de
 * otro tenant: distinguirlos confirmaría a un tercero que el envío existe en
 * otra organización.
 */
export enum TrackingErrorReason {
  // --- Recursos fuera de alcance (404 uniforme) ---
  SHIPMENT_NOT_FOUND = 'TRACKING_SHIPMENT_NOT_FOUND',
  SUBJECT_NOT_FOUND = 'TRACKING_SUBJECT_NOT_FOUND',

  // --- Recurso del tenant, pero no asignado al actor (403) ---
  SHIPMENT_ACCESS_DENIED = 'TRACKING_SHIPMENT_ACCESS_DENIED',

  // --- Webhook del transportista no autenticado (401) ---
  /** Firma ausente, con formato inválido o que no verifica; también transportista sin secreto. */
  WEBHOOK_SIGNATURE_INVALID = 'TRACKING_WEBHOOK_SIGNATURE_INVALID',
  /** Firma válida pero con marca de tiempo fuera de la ventana anti-replay. */
  WEBHOOK_REPLAY_REJECTED = 'TRACKING_WEBHOOK_REPLAY_REJECTED',
}
