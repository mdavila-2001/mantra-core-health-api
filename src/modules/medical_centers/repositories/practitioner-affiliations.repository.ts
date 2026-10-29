import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthcareServices,
  PractitionerRoleAssignments,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { PractitionerAffiliationsPort } from '../ports/medical-center.ports';

/** Dónde trabaja un médico: afiliaciones `ACTIVE` y vigentes por procedimiento. */
@Injectable()
export class PractitionerAffiliationsRepository extends PractitionerAffiliationsPort {
  /** @inheritdoc */
  async findActiveSites(
    em: EntityManager,
    practitionerProfileIds: readonly string[],
    practiceSiteIds: readonly string[],
    procedureConceptIds: readonly string[],
  ): Promise<{ practitionerProfileId: string; practiceSiteId: string }[]> {
    if (
      practitionerProfileIds.length === 0 ||
      practiceSiteIds.length === 0 ||
      procedureConceptIds.length === 0
    ) {
      return [];
    }
    // `INVITED`, `PENDING`, `SUSPENDED`, `REJECTED` y `ENDED` no cuentan: solo
    // figura en un centro quien ya lo aceptó y sigue vigente.
    const roles = await em.find(PractitionerRoleAssignments, {
      practitionerProfileId: { $in: [...practitionerProfileIds] },
      practiceSiteId: { $in: [...practiceSiteIds] },
      statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      validTo: null,
      healthcareServiceId: { $ne: null },
    });
    if (roles.length === 0) return [];

    const services = await em.find(
      HealthcareServices,
      {
        id: {
          $in: roles
            .map((role) => role.healthcareServiceId)
            .filter((id): id is string => id !== undefined && id !== null),
        },
        serviceConceptId: { $in: [...procedureConceptIds] },
      },
      { fields: ['id'] },
    );
    const matching = new Set(services.map((service) => service.id));

    const seen = new Set<string>();
    const pairs: { practitionerProfileId: string; practiceSiteId: string }[] =
      [];
    for (const role of roles) {
      if (!role.healthcareServiceId || !matching.has(role.healthcareServiceId))
        continue;
      const key = `${role.practitionerProfileId}:${role.practiceSiteId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({
        practitionerProfileId: role.practitionerProfileId,
        practiceSiteId: role.practiceSiteId!,
      });
    }
    return pairs;
  }
}
