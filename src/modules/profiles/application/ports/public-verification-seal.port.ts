import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * El sello público de verificado (comunidad). Lo escribe el proyector de la
 * admisión, y nadie más, dentro de la misma transacción que la decisión.
 */
export interface PublicVerificationSealPort {
  /** Concede o renueva el sello hasta `validTo`. */
  grant(
    tx: EntityManager,
    input: {
      practitionerProfileId: string;
      actorUserId: string;
      evidenceRef: string;
      validTo?: Date;
    },
  ): Promise<void>;
  /** Baja el sello (revocado o vencido). */
  revoke(
    tx: EntityManager,
    practitionerProfileId: string,
    actorUserId: string,
    reason: 'REVOKED' | 'EXPIRED',
  ): Promise<void>;
}

export const PUBLIC_VERIFICATION_SEAL_PORT = Symbol(
  'PUBLIC_VERIFICATION_SEAL_PORT',
);
