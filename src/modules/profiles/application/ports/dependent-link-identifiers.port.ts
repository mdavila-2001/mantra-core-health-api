import type { EntityManager } from '@mikro-orm/postgresql';

export interface DependentLinkIdentifiersPort {
  /** Documento nacional activo de un paciente con este número (forma canónica). */
  findActiveNationalIdDuplicate(
    em: EntityManager,
    nationalId: string,
  ): Promise<{ readonly ownerId: string } | null>;
}

export const DEPENDENT_LINK_IDENTIFIERS_PORT = Symbol(
  'DEPENDENT_LINK_IDENTIFIERS_PORT',
);
