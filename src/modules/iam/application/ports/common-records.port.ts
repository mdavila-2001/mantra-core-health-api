import type { EntityManager } from '@mikro-orm/postgresql';

/** Lo que hace falta para escribir una dirección de una persona. */
export interface PersonAddressInput {
  readonly personId: string;
  readonly municipalityConceptId?: string;
  readonly lines?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly actorUserId: string;
}

/**
 * Registros de `common` que las altas escriben junto a la cuenta:
 * identificadores oficiales, puntos de contacto y direcciones.
 *
 * Las cargas de `create*` son las de los repositorios de `common`
 * (`CreateIdentifierData`, `CreateContactPointData`).
 */
export interface CommonRecordsPort {
  createIdentifier(tx: EntityManager, data: object): unknown;
  createContactPoint(tx: EntityManager, data: object): unknown;
  /** Domicilio de residencia; valida el municipio contra el catálogo. */
  createResidenceAddress(
    tx: EntityManager,
    data: PersonAddressInput,
  ): Promise<boolean>;
  /** Domicilio laboral; mismo criterio que el de residencia. */
  createWorkAddress(
    tx: EntityManager,
    data: PersonAddressInput,
  ): Promise<boolean>;
}

export const COMMON_RECORDS_PORT = Symbol('IAM_COMMON_RECORDS_PORT');
