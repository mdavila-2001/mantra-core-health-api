/**
 * Catálogo de sub-códigos de negocio estables del módulo `consent`. Se usan
 * como tercer argumento (`reason`) de las excepciones de dominio, para que un
 * cliente pueda ramificar sobre el caso exacto sin parsear el `message`.
 */
export enum ConsentErrorReason {
  /** El consentimiento no existe o no pertenece al tenant activo. */
  CONSENT_NOT_FOUND = 'CONSENT_NOT_FOUND',
  /** La autorización HIPAA no existe o no pertenece al tenant activo. */
  HIPAA_AUTHORIZATION_NOT_FOUND = 'HIPAA_AUTHORIZATION_NOT_FOUND',
  /** El perfil de paciente indicado no existe. */
  PATIENT_PROFILE_NOT_FOUND = 'PATIENT_PROFILE_NOT_FOUND',
  /** El propósito de tratamiento indicado no existe. */
  PROCESSING_PURPOSE_NOT_FOUND = 'PROCESSING_PURPOSE_NOT_FOUND',
  /** La base legal no existe o no pertenece al tenant activo. */
  PROCESSING_LEGAL_BASIS_NOT_FOUND = 'PROCESSING_LEGAL_BASIS_NOT_FOUND',
  /** La base legal pertenece a un propósito distinto del indicado. */
  CONSENT_LEGAL_BASIS_PURPOSE_MISMATCH = 'CONSENT_LEGAL_BASIS_PURPOSE_MISMATCH',
  /** El tenant del cuerpo no coincide con el tenant activo del actor. */
  CONSENT_TENANT_SCOPE_REQUIRED = 'CONSENT_TENANT_SCOPE_REQUIRED',
}
