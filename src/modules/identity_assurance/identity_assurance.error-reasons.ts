/**
 * Catálogo de sub-códigos de negocio estables para el módulo `identity_assurance`
 * (casos, evidencia, checks, autoridades y aserciones de identidad). Se usan como
 * 3er argumento (`reason`) de `DomainException` y sus subclases, encima del
 * `code` genérico (NOT_FOUND, etc.) que ya fija el status HTTP.
 *
 * Los `*_NOT_AVAILABLE` se lanzan igual para un UUID inexistente que para uno
 * de otro tenant: distinguirlos le confirmaría a un tercero que el recurso
 * existe en otra organización.
 */
export enum IdentityAssuranceErrorReason {
  // --- Recursos fuera de alcance (404 uniforme) ---
  CASE_NOT_AVAILABLE = 'IDENTITY_CASE_NOT_AVAILABLE',
  SUBJECT_NOT_AVAILABLE = 'IDENTITY_SUBJECT_NOT_AVAILABLE',
  AUTHORITY_NOT_AVAILABLE = 'IDENTITY_AUTHORITY_NOT_AVAILABLE',
  EVIDENCE_FILE_NOT_AVAILABLE = 'IDENTITY_EVIDENCE_FILE_NOT_AVAILABLE',
  CONSENT_NOT_AVAILABLE = 'IDENTITY_CONSENT_NOT_AVAILABLE',
  ASSERTION_NOT_AVAILABLE = 'IDENTITY_ASSERTION_NOT_AVAILABLE',
  REVIEW_NOT_AVAILABLE = 'IDENTITY_REVIEW_NOT_AVAILABLE',
  ENDPOINT_NOT_AVAILABLE = 'IDENTITY_ENDPOINT_NOT_AVAILABLE',
}
