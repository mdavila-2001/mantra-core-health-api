/**
 * Enumeraciones del consentimiento informado dirigido (v4266).
 *
 * En la base son `varchar` + `CHECK` (mismo criterio que `siat_mode`, v4262),
 * no conceptos: los valores son parte del contrato de la API y del CHECK, y el
 * cliente ramifica sobre ellos.
 */

/** A qué objeto clínico se consiente. */
export const INFORMED_CONSENT_TARGET_TYPES = [
  'MEDICATION_REQUEST',
  'SERVICE_REQUEST',
  'REFERRAL',
  'PROCEDURE',
  'CARE_PLAN',
] as const;
/** A qué objeto clínico se consiente. */
export type InformedConsentTargetType =
  (typeof INFORMED_CONSENT_TARGET_TYPES)[number];

/** Quién otorga el consentimiento. */
export const INFORMED_CONSENT_GRANTED_BY = [
  'PATIENT',
  'LEGAL_REPRESENTATIVE',
  'GUARDIAN',
  'SUBSTITUTE_RELATIVE',
] as const;
/** Quién otorga el consentimiento. */
export type InformedConsentGrantedBy =
  (typeof INFORMED_CONSENT_GRANTED_BY)[number];

/** Canal por el que se informó y se consintió. */
export const INFORMED_CONSENT_CHANNELS = ['IN_PERSON', 'TELEHEALTH'] as const;
/** Canal por el que se informó y se consintió. */
export type InformedConsentChannel = (typeof INFORMED_CONSENT_CHANNELS)[number];

/** Excepciones legales al deber de recabar el consentimiento. */
export const INFORMED_CONSENT_EXCEPTION_TYPES = [
  'EMERGENCY',
  'PUBLIC_HEALTH_RISK',
  'PATIENT_WAIVER',
] as const;
/** Excepciones legales al deber de recabar el consentimiento. */
export type InformedConsentExceptionType =
  (typeof INFORMED_CONSENT_EXCEPTION_TYPES)[number];

/** Estado legible del consentimiento: vigente o revocado. */
export type InformedConsentStatus = 'ACTIVE' | 'WITHDRAWN';
