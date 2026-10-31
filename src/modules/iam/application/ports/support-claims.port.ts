import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Vínculos de apoyo del titular, acotados al límite de autenticación: al
 * emitir el token se resuelve en qué organizaciones tiene un vínculo de apoyo
 * activo, para materializar el rol de runtime `SUPPORT_STAFF`.
 */
export interface SupportClaimsPort {
  /** Organizaciones donde el usuario tiene un vínculo de apoyo activo y vigente. */
  listTenantIdsWithActiveEngagement(
    em: EntityManager,
    userId: string,
  ): Promise<string[]>;
}

export const SUPPORT_CLAIMS_PORT = Symbol('IAM_SUPPORT_CLAIMS_PORT');
