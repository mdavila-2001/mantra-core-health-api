/**
 * Enumeraciones de la derivación a servicios específicos (v4266).
 *
 * En la base son `varchar` + `CHECK` (`ck_referrals_referral_type`); los
 * estados legibles se derivan del concepto de estado.
 */

/** Tipo de derivación: atención, servicio de tratamiento, orden de análisis… */
export const REFERRAL_TYPES = [
  'CONSULTATION',
  'TREATMENT',
  'PROCEDURE',
  'DIAGNOSTIC',
  'THERAPY',
  'HOSPITALIZATION',
  'OTHER',
] as const;
/** Tipo de derivación. */
export type ReferralType = (typeof REFERRAL_TYPES)[number];

/** Estado legible de la derivación. */
export type ReferralStatus =
  'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
