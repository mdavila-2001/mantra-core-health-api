import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common';
import { DIR } from '../../../directory/directory.concepts';
import { TenantMemberships } from '../../../directory/entities';
import { isEngagementLive } from '../../../delegated_access/domain';
import { OrganizationUserAssignments } from '../../../delegated_access/entities';
import type { SupportClaimsPort } from '../../application/ports/support-claims.port';

/**
 * Lectura cross-dominio de `delegated_access` acotada al límite de
 * autenticación: en qué organizaciones el titular tiene un vínculo de apoyo
 * activo (con plantilla de rol), dentro de su vigencia.
 */
@Injectable()
export class DelegatedAccessSupportClaimsAdapter implements SupportClaimsPort {
  async listTenantIdsWithActiveEngagement(
    em: EntityManager,
    userId: string,
  ): Promise<string[]> {
    const now = new Date();
    // Solo membresías activas y no terminadas: un vínculo cuya membresía se
    // cerró (fin de contrato) no vuelve a figurar en el token.
    const memberships = (await em.find(TenantMemberships, { userId })).filter(
      (m) =>
        m.statusConceptId === DIR.MEMBERSHIP_ACTIVE &&
        (!m.endDate || m.endDate > now),
    );
    if (memberships.length === 0) return [];
    const engagements = await em.find(OrganizationUserAssignments, {
      tenantMembershipId: { $in: memberships.map((m) => m.id) },
      roleTemplateId: { $ne: null },
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const live = new Set(
      engagements
        .filter(
          (e) =>
            (!e.validFrom || e.validFrom <= now) &&
            (!e.validTo || e.validTo > now) &&
            // Recertificación vencida (+gracia): sin rol de apoyo en el token.
            isEngagementLive(
              {
                assignmentActive: true,
                membershipActive: true,
                nextRecertificationAt: e.nextRecertificationAt,
              },
              now,
            ),
        )
        .map((e) => e.tenantMembershipId),
    );
    return [
      ...new Set(
        memberships.filter((m) => live.has(m.id)).map((m) => m.tenantId),
      ),
    ];
  }
}
