/**
 * Sub-códigos de negocio estables de las derivaciones (`clinical_ext`, v4263).
 *
 * `code` (en `DomainException`) dice el tipo HTTP del error; `reason` dice
 * cuál error concreto fue. El cliente ramifica sobre `reason` sin parsear
 * `message`.
 */
export enum ReferralErrorReason {
  /** Una derivación tipada necesita al menos un destino. */
  REFERRAL_TARGET_REQUIRED = 'REFERRAL_TARGET_REQUIRED',
  /** Una derivación tipada necesita resumen clínico y servicio pedido. */
  REFERRAL_SERVICE_INFORMATION_INCOMPLETE = 'REFERRAL_SERVICE_INFORMATION_INCOMPLETE',
  /** La sede destino no existe. */
  REFERRAL_TARGET_BRANCH_NOT_FOUND = 'REFERRAL_TARGET_BRANCH_NOT_FOUND',
  /** El consentimiento indicado no existe. */
  REFERRAL_CONSENT_NOT_FOUND = 'REFERRAL_CONSENT_NOT_FOUND',
  /** El consentimiento indicado es de otro paciente. */
  REFERRAL_CONSENT_PATIENT_MISMATCH = 'REFERRAL_CONSENT_PATIENT_MISMATCH',
  /** El consentimiento indicado no fue aceptado. */
  REFERRAL_CONSENT_NOT_ACCEPTED = 'REFERRAL_CONSENT_NOT_ACCEPTED',
  /** El consentimiento indicado está revocado. */
  REFERRAL_CONSENT_WITHDRAWN = 'REFERRAL_CONSENT_WITHDRAWN',
  /** La derivación no existe. */
  REFERRAL_NOT_FOUND = 'REFERRAL_NOT_FOUND',
  /** La derivación no está pendiente de respuesta. */
  REFERRAL_NOT_PENDING = 'REFERRAL_NOT_PENDING',
  /** Rechazar exige motivo. */
  REFERRAL_REJECT_REASON_REQUIRED = 'REFERRAL_REJECT_REASON_REQUIRED',
  /** Sólo el destino (o quien deriva a un destino externo) registra la contrarreferencia. */
  REFERRAL_COUNTER_REFERRAL_FORBIDDEN = 'REFERRAL_COUNTER_REFERRAL_FORBIDDEN',
  /** La derivación no está en un estado que admita contrarreferencia. */
  REFERRAL_COUNTER_REFERRAL_NOT_ALLOWED = 'REFERRAL_COUNTER_REFERRAL_NOT_ALLOWED',
  /** La derivación ya está cerrada (rechazada, completada o anulada). */
  REFERRAL_ALREADY_CLOSED = 'REFERRAL_ALREADY_CLOSED',
}
