import type { EntityManager } from '@mikro-orm/postgresql';

/** Un sitio físico de la farmacia declarado en el alta: la central o una sucursal. */
export interface PharmacyRegistrationSite {
  readonly name: string;
  readonly addressLines?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

/**
 * La farmacia que nace con el alta (P50): la fila de `pharmacy.pharmacies` en
 * borrador y sin verificar, su práctica propia, la casa central y cada
 * sucursal como sede física y sede dispensadora, y la central enlazada.
 * Escribe en la transacción del alta; no abre otra.
 */
export interface PharmacyRegistrationPort {
  provision(
    tx: EntityManager,
    owner: {
      readonly tenantId: string;
      readonly code: string;
      readonly legalName: string;
      readonly tradeName?: string;
      readonly ownerUserId: string;
      readonly timeZone?: string;
    },
    profile: {
      readonly headquarters: PharmacyRegistrationSite;
      readonly branches?: readonly PharmacyRegistrationSite[];
    },
    actorUserId: string,
  ): Promise<{ readonly pharmacyId: string }>;
}

export const PHARMACY_REGISTRATION_PORT = Symbol(
  'IAM_PHARMACY_REGISTRATION_PORT',
);
