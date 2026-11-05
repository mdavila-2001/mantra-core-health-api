/**
 * Catálogo de sub-códigos de negocio estables para el módulo `health_data`
 * (ingesta, recurso canónico, MPI, de-identificación y exportación). Se usan
 * como 3er argumento (`reason`) de `DomainException` y sus subclases, encima del
 * `code` genérico (NOT_FOUND, etc.) que ya fija el status HTTP.
 *
 * Los `*_NOT_AVAILABLE` se lanzan igual para un UUID inexistente que para uno
 * de otro tenant (o que el actor no puede leer): distinguirlos le confirmaría a
 * un tercero que el recurso existe en otra organización.
 */
export enum HealthDataErrorReason {
  // --- Recursos fuera de alcance (404 uniforme) ---
  PATIENT_NOT_AVAILABLE = 'HEALTH_DATA_PATIENT_NOT_AVAILABLE',
  SOURCE_CONNECTION_NOT_AVAILABLE = 'HEALTH_DATA_SOURCE_CONNECTION_NOT_AVAILABLE',
  SOURCE_SYSTEM_NOT_AVAILABLE = 'HEALTH_DATA_SOURCE_SYSTEM_NOT_AVAILABLE',
  INGESTION_BATCH_NOT_AVAILABLE = 'HEALTH_DATA_INGESTION_BATCH_NOT_AVAILABLE',
  INGESTION_RECORD_NOT_AVAILABLE = 'HEALTH_DATA_INGESTION_RECORD_NOT_AVAILABLE',
  DEID_PROFILE_NOT_AVAILABLE = 'HEALTH_DATA_DEID_PROFILE_NOT_AVAILABLE',
  DEID_RUN_NOT_AVAILABLE = 'HEALTH_DATA_DEID_RUN_NOT_AVAILABLE',
  RESOURCE_VERSION_NOT_AVAILABLE = 'HEALTH_DATA_RESOURCE_VERSION_NOT_AVAILABLE',
  COHORT_NOT_AVAILABLE = 'HEALTH_DATA_COHORT_NOT_AVAILABLE',
  CONSENT_NOT_AVAILABLE = 'HEALTH_DATA_CONSENT_NOT_AVAILABLE',
  FILE_NOT_AVAILABLE = 'HEALTH_DATA_FILE_NOT_AVAILABLE',

  // --- Coherencia de la cadena de ingesta (422) ---
  SOURCE_SYSTEM_MISMATCH = 'HEALTH_DATA_SOURCE_SYSTEM_MISMATCH',
}
