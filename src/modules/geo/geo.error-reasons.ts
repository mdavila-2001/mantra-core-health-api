/**
 * Catálogo de sub-códigos de negocio estables para el módulo `geo`
 * (sujetos rastreados, sesiones, pings, geofences y viajes). Se usan como 3er
 * argumento (`reason`) de `DomainException` y sus subclases, encima del
 * `code` genérico (NOT_FOUND, PRECONDITION_FAILED, etc.) que ya fija el status HTTP.
 *
 * Los `*_NOT_AVAILABLE` se lanzan igual para un UUID inexistente que para uno
 * de otro tenant: distinguirlos confirmaría a un tercero que el recurso existe.
 */
export enum GeoErrorReason {
  // --- Recursos fuera de alcance (404 uniforme) ---
  TRACKED_SUBJECT_NOT_AVAILABLE = 'GEO_TRACKED_SUBJECT_NOT_AVAILABLE',
  GEOFENCE_NOT_AVAILABLE = 'GEO_GEOFENCE_NOT_AVAILABLE',
  TRACKING_SESSION_NOT_AVAILABLE = 'GEO_TRACKING_SESSION_NOT_AVAILABLE',
  TRIP_NOT_AVAILABLE = 'GEO_TRIP_NOT_AVAILABLE',

  // --- Integridad entre tenants (422) ---
  GEOFENCE_SUBJECT_TENANT_MISMATCH = 'GEO_GEOFENCE_SUBJECT_TENANT_MISMATCH',
}
