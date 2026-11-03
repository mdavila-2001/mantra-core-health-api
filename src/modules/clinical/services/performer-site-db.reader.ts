import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceCatalog } from '../../billing/entities';
import {
  HealthcareServices,
  PracticeSites,
  PractitionerRoleAssignments,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { PerformerSiteReader } from './performer-site.reader';

/**
 * Lee de las tablas de `practice` y `billing` lo que la validación del ejecutor
 * necesita, por el `EntityManager` y sin importar `PracticeModule` (que
 * arrastraría el módulo de personal entero a `clinical`).
 */
@Injectable()
export class PerformerSiteDbReader extends PerformerSiteReader {
  /** @inheritdoc */
  async offersProcedureWithPrice(
    em: EntityManager,
    practiceSiteId: string,
    procedureConceptId: string,
  ): Promise<boolean> {
    const site = await em.findOne(
      PracticeSites,
      { id: practiceSiteId, statusConceptId: PRAC.SITE_ACTIVE },
      { fields: ['id'] },
    );
    if (!site) return false;

    const service = await em.findOne(HealthcareServices, {
      practiceSiteId,
      serviceConceptId: procedureConceptId,
      statusConceptId: PRAC.SERVICE_ACTIVE,
      serviceCatalogId: { $ne: null },
    });
    if (!service?.serviceCatalogId) return false;

    const item = await em.findOne(
      ServiceCatalog,
      { id: service.serviceCatalogId, isActive: true },
      { fields: ['id'] },
    );
    return item !== null;
  }

  /** @inheritdoc */
  async isActivelyAffiliated(
    em: EntityManager,
    practitionerProfileId: string,
    practiceSiteId: string,
    procedureConceptId: string,
  ): Promise<boolean> {
    const roles = await em.find(
      PractitionerRoleAssignments,
      {
        practitionerProfileId,
        practiceSiteId,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        validTo: null,
        healthcareServiceId: { $ne: null },
      },
      { fields: ['id', 'healthcareServiceId'] },
    );
    const serviceIds = roles
      .map((role) => role.healthcareServiceId)
      .filter((id): id is string => id !== undefined && id !== null);
    if (serviceIds.length === 0) return false;

    const match = await em.findOne(
      HealthcareServices,
      { id: { $in: serviceIds }, serviceConceptId: procedureConceptId },
      { fields: ['id'] },
    );
    return match !== null;
  }
}
