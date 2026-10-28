/**
 * Enumeraciones de la derivación a servicios específicos (v4266).
 *
 * El tipo de derivación vive en `referral_type_concept_id` (concepto
 * `CEXT.REFERRAL_TYPE_*`, ver `dto/referral.dto.ts`); los estados legibles se
 * derivan del concepto de estado.
 */

/** Estado legible de la derivación. */
export type ReferralStatus =
  'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
