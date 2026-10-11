import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

export interface AffiliationSite {
  readonly id: string;
  readonly managingTenantId?: string | null;
}

export interface AffiliationOrganizationsPort {
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
