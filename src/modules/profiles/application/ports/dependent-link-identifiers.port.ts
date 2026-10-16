import type { EntityManager } from '@mikro-orm/postgresql';

export interface DependentLinkIdentifiersPort {
  findActiveDuplicate(
    em: EntityManager,
    params: { readonly typeConceptId: string; readonly value: string },
  ): Promise<{ readonly ownerId: string } | null>;
}

export const DEPENDENT_LINK_IDENTIFIERS_PORT = Symbol(
  'DEPENDENT_LINK_IDENTIFIERS_PORT',
);
