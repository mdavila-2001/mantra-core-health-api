/**
 * Sub-códigos de negocio estables del consentimiento informado de tratamiento.
 *
 * `code` (en `DomainException`) dice el tipo HTTP del error; `reason` dice
 * cuál error concreto fue. El cliente ramifica sobre `reason` sin parsear
 * `message`.
 */
export enum ConsentErrorReason {
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
