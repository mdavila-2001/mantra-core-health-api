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

  // --- Consentimiento informado de tratamiento dirigido (v4266) ---
  /** `targetType` y `targetId` van juntos: los dos o ninguno. */
  INFORMED_CONSENT_TARGET_INCOMPLETE = 'INFORMED_CONSENT_TARGET_INCOMPLETE',
  /** Con `targetType` y sin excepción faltan propósito, riesgos o beneficios. */
  INFORMED_CONSENT_INFORMATION_INCOMPLETE = 'INFORMED_CONSENT_INFORMATION_INCOMPLETE',
  /** Con `exceptionType` falta `exceptionJustification`. */
  INFORMED_CONSENT_EXCEPTION_UNJUSTIFIED = 'INFORMED_CONSENT_EXCEPTION_UNJUSTIFIED',
  /** Otorga un representante y falta su nombre o su parentesco/calidad. */
  INFORMED_CONSENT_REPRESENTATIVE_INCOMPLETE = 'INFORMED_CONSENT_REPRESENTATIVE_INCOMPLETE',
  /** El objeto consentido no existe. */
  INFORMED_CONSENT_TARGET_NOT_FOUND = 'INFORMED_CONSENT_TARGET_NOT_FOUND',
  /** El objeto consentido es de otro paciente. */
  INFORMED_CONSENT_TARGET_PATIENT_MISMATCH = 'INFORMED_CONSENT_TARGET_PATIENT_MISMATCH',
  /** El `patientProfileId` del cuerpo no es el paciente del encuentro. */
  INFORMED_CONSENT_ENCOUNTER_PATIENT_MISMATCH = 'INFORMED_CONSENT_ENCOUNTER_PATIENT_MISMATCH',
  /** El encuentro no existe. */
  INFORMED_CONSENT_ENCOUNTER_NOT_FOUND = 'INFORMED_CONSENT_ENCOUNTER_NOT_FOUND',
  /** El consentimiento no existe. */
  INFORMED_CONSENT_NOT_FOUND = 'INFORMED_CONSENT_NOT_FOUND',
  /** El consentimiento ya estaba revocado. */
  INFORMED_CONSENT_ALREADY_WITHDRAWN = 'INFORMED_CONSENT_ALREADY_WITHDRAWN',
  /** Otorga un representante y no se dejó constancia del asentimiento (true/false). */
  INFORMED_CONSENT_ASSENT_REQUIRED = 'INFORMED_CONSENT_ASSENT_REQUIRED',
  /** Consentimiento ACCEPTED dirigido sin constancia de que se informó el derecho a revocar. */
  INFORMED_CONSENT_REVOCATION_RIGHT_NOT_INFORMED = 'INFORMED_CONSENT_REVOCATION_RIGHT_NOT_INFORMED',
  /** La información posterior sólo aplica a la excepción EMERGENCY. */
  INFORMED_CONSENT_NOT_EMERGENCY = 'INFORMED_CONSENT_NOT_EMERGENCY',
  /** La información posterior a la emergencia ya estaba registrada. */
  INFORMED_CONSENT_POST_EMERGENCY_ALREADY_INFORMED = 'INFORMED_CONSENT_POST_EMERGENCY_ALREADY_INFORMED',
  /** La fecha de información posterior es futura o anterior al consentimiento. */
  INFORMED_CONSENT_POST_EMERGENCY_DATE_INVALID = 'INFORMED_CONSENT_POST_EMERGENCY_DATE_INVALID',
}
