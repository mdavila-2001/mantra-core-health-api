/**
 * Catálogo de sub-códigos de negocio estables para el módulo `telemetry`
 * (consentimiento de tracking, ingesta de eventos y analítica administrativa).
 * Se usan como 3er argumento (`reason`) de `DomainException` y sus subclases,
 * encima del `code` genérico (NOT_FOUND, PRECONDITION_FAILED, etc.).
 *
 * Los `*_NOT_OWNED` y `*_OUT_OF_SCOPE` se lanzan igual para un UUID inexistente
 * que para uno de otra persona u organización: distinguirlos le confirmaría a un
 * tercero que el recurso existe.
 */
export enum TelemetryErrorReason {
  // --- Consentimiento (404 uniforme / 422) ---
  CONSENT_NOT_OWNED = 'TELEMETRY_CONSENT_NOT_OWNED',
  CONSENT_NOT_ACTIVE = 'TELEMETRY_CONSENT_NOT_ACTIVE',

  // --- Referencias de ingesta fuera de alcance del actor (404 uniforme) ---
  JOURNEY_OUT_OF_SCOPE = 'TELEMETRY_JOURNEY_OUT_OF_SCOPE',
  SUBJECT_OUT_OF_SCOPE = 'TELEMETRY_SUBJECT_OUT_OF_SCOPE',
  EVENT_OUT_OF_SCOPE = 'TELEMETRY_EVENT_OUT_OF_SCOPE',
  CONTEXT_OUT_OF_SCOPE = 'TELEMETRY_CONTEXT_OUT_OF_SCOPE',

  // --- La sesión autenticada no tiene fila de sesión (412) ---
  SESSION_NOT_RESOLVED = 'TELEMETRY_SESSION_NOT_RESOLVED',

  // --- Analítica administrativa fuera del tenant activo (404 uniforme) ---
  SESSION_OUT_OF_SCOPE = 'TELEMETRY_SESSION_OUT_OF_SCOPE',

  // --- Propiedades de evento (422) ---
  EVENT_PROPERTY_NOT_ALLOWED = 'TELEMETRY_EVENT_PROPERTY_NOT_ALLOWED',

  // --- Esquema de evento reemplazado (412) ---
  EVENT_SCHEMA_NOT_ACTIVE = 'TELEMETRY_EVENT_SCHEMA_NOT_ACTIVE',

  // --- Evento de uso agregado sin plantilla de ruta válida (422) ---
  ANONYMOUS_ROUTE_INVALID = 'TELEMETRY_ANONYMOUS_ROUTE_INVALID',
}
