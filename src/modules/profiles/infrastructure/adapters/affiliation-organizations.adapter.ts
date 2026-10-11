import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import {
  DirectoryMembershipsService,
  TenantAdministrationService,
} from '../../../directory/services';
import { PracticeSites } from '../../../practice/entities';
import type { AffiliationOrganizationsPort } from '../../application/ports/affiliation-organizations.port';

@Injectable()
export class AffiliationOrganizationsAdapter implements AffiliationOrganizationsPort {
  constructor(
    private readonly tenantAdministration: TenantAdministrationService,
    private readonly directoryMemberships: DirectoryMembershipsService,
  ) {}

  findSite(em: EntityManager, siteId: string) {
    return em.findOne(PracticeSites, { id: siteId });
  }

  findSitesByTenant(em: EntityManager, tenantId: string) {
    return em.find(
      PracticeSites,
      { managingTenantId: tenantId },
      { fields: ['id'] },
    );
  }

  findSiteForTenant(em: EntityManager, siteId: string, tenantId: string) {
    return em.findOne(PracticeSites, {
      id: siteId,
      managingTenantId: tenantId,
    });
  }

  hasAdministrators(em: EntityManager, tenantId: string) {
    return this.tenantAdministration.hasAdministrators(em, tenantId);
  }

  assertCanAdminister(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ) {
    return this.tenantAdministration.assertCanAdminister(em, tenantId, actor);
  }

  ensureCareMembership(
    em: EntityManager,
    input: { userId: string; tenantId: string; actorUserId: string },
  ) {
    return this.directoryMemberships.ensureCareMembership(em, input);
  }
}
