import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

export interface AffiliationSite {
  readonly id: string;
  readonly managingTenantId?: string | null;
}

/**
 * Una organización del directorio público, lista para pedirle un vínculo.
 *
 * `siteId` es su primera sede activa —la que recibe el pedido en su bandeja—,
 * o `null` si todavía no cargó ninguna.
 */
export interface PublicOrganizationForAffiliation {
  readonly slug: string;
  readonly practiceId: string;
  readonly name: string;
  readonly siteId: string | null;
}

export interface AffiliationOrganizationsPort {
  /**
   * Las organizaciones públicas activas con esos slugs (los del buscador
   * público). Los slugs que no nombran ninguna no vuelven.
   */
  findPublicOrganizations(
    em: EntityManager,
    slugs: readonly string[],
  ): Promise<PublicOrganizationForAffiliation[]>;
  findSite(em: EntityManager, siteId: string): Promise<AffiliationSite | null>;
  findSitesByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<AffiliationSite[]>;
  findSiteForTenant(
    em: EntityManager,
    siteId: string,
    tenantId: string,
  ): Promise<AffiliationSite | null>;
  hasAdministrators(em: EntityManager, tenantId: string): Promise<boolean>;
  assertCanAdminister(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;
  ensureCareMembership(
    em: EntityManager,
    input: { userId: string; tenantId: string; actorUserId: string },
  ): Promise<{ membership: { id: string }; creada: boolean }>;
}

export const AFFILIATION_ORGANIZATIONS_PORT = Symbol(
  'AFFILIATION_ORGANIZATIONS_PORT',
);
