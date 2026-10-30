import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import {
  DirectoryMembershipsService,
  TenantAdministrationService,
} from '../../../directory/services';
import { COMM } from '../../../community/community.concepts';
import { PublicProfiles } from '../../../community/entities';
import { PRAC } from '../../../practice/practice.concepts';
import { Practices, PracticeSites } from '../../../practice/entities';
import type {
  AffiliationOrganizationsPort,
  PublicOrganizationForAffiliation,
} from '../../application/ports/affiliation-organizations.port';

@Injectable()
export class AffiliationOrganizationsAdapter implements AffiliationOrganizationsPort {
  constructor(
    private readonly tenantAdministration: TenantAdministrationService,
    private readonly directoryMemberships: DirectoryMembershipsService,
  ) {}

  /**
   * Del slug público a la sede que recibe el pedido.
   *
   * Sólo vitrinas de organización **públicas**: es lo que el profesional pudo
   * ver en el buscador. Y sólo prácticas activas: pedirle entrar a una cerrada
   * dejaría un pedido que nadie va a leer. La sede es la primera activa por
   * antigüedad —la principal en la práctica—, la misma que la bandeja de la
   * organización resuelve por tenant.
   */
  async findPublicOrganizations(
    em: EntityManager,
    slugs: readonly string[],
  ): Promise<PublicOrganizationForAffiliation[]> {
    if (slugs.length === 0) return [];
    const profiles = await em.find(PublicProfiles, {
      slug: { $in: [...slugs] },
      targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
    });
    if (profiles.length === 0) return [];
    const practices = await em.find(Practices, {
      id: { $in: profiles.map((p) => p.targetId) },
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    });
    const sites = practices.length
      ? await em.find(
          PracticeSites,
          {
            practiceId: { $in: practices.map((p) => p.id) },
            statusConceptId: PRAC.SITE_ACTIVE,
          },
          { orderBy: { createdAt: 'asc' } },
        )
      : [];
    return profiles.flatMap((profile) => {
      const practice = practices.find((p) => p.id === profile.targetId);
      if (!practice) return [];
      const site = sites.find((s) => s.practiceId === practice.id);
      return [
        {
          slug: profile.slug,
          practiceId: practice.id,
          name: practice.name,
          siteId: site?.id ?? null,
        },
      ];
    });
  }

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
