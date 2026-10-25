import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * La fila de `pharmacy.pharmacies` que nace con el alta de una farmacia, en
 * borrador y sin verificar. La carga es la de la entidad `Pharmacies`.
 */
export interface PharmacyRegistrationPort {
  createPharmacy(tx: EntityManager, data: object): void;
}

export const PHARMACY_REGISTRATION_PORT = Symbol(
  'IAM_PHARMACY_REGISTRATION_PORT',
);
