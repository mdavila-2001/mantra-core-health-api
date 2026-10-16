import type { EntityManager } from '@mikro-orm/postgresql';

export interface ProfileValueSet {
  readonly id: string;
}

export interface ProfileCatalogConcept {
  readonly id: string;
  readonly code: string;
  readonly display: string;
}

export interface ProfileConceptProperty {
  readonly conceptId: string;
  readonly valueJson: unknown;
}

/** Read-only terminology queries required by profile registration and search. */
export interface ProfilesTerminologyPort {
  findByInternalCode(
    em: EntityManager,
    internalCode: string,
  ): Promise<ProfileValueSet | null>;
  findIncludedConceptIdsByValueSet(
    em: EntityManager,
    valueSetId: string,
  ): Promise<string[] | null>;
  search(
    em: EntityManager,
    filters: { query?: string; ids?: string[] },
    limit: number,
  ): Promise<ProfileCatalogConcept[]>;
  findPropertyForConcepts(
    em: EntityManager,
    conceptIds: string[],
    propertyCode: string,
  ): Promise<ProfileConceptProperty[]>;
}

export const PROFILES_TERMINOLOGY_PORT = Symbol('PROFILES_TERMINOLOGY_PORT');
