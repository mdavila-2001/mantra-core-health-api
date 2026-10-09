import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerAffiliations } from '../../../profiles/entities';
import { esEstado } from '../../../profiles/services/profiles-affiliations.service';
import type {
  AffiliationStatus,
  PractitionerAffiliationFact,
  PractitionerAffiliationsPort,
} from '../../application/ports/practitioner-affiliations.port';

/** Conceptos de estado de `profiles`, en el orden en que se clasifican. */
const STATUS_BY_STATE: readonly [
  Parameters<typeof esEstado>[1],
  AffiliationStatus,
][] = [
  ['APROBADO', 'APPROVED'],
  ['DECLARADO', 'DECLARED'],
  ['PENDIENTE', 'PENDING'],
  ['RECHAZADO', 'REJECTED'],
  ['REVOCADO', 'REVOKED'],
];

/** Implementa los vínculos del profesional sobre `profiles` y `practice`. */
@Injectable()
export class ProfilesAffiliationsAdapter implements PractitionerAffiliationsPort {
  constructor(private readonly em: EntityManager) {}

  async findOfPractitioner(
    practitionerProfileId: string,
  ): Promise<PractitionerAffiliationFact[]> {
    const affiliations = await this.em.find(
      PractitionerAffiliations,
      { practitionerProfileId },
      { fields: ['practiceSiteId', 'statusConceptId', 'organizationName'] },
    );

    return affiliations
      .filter(
        (v): v is (typeof affiliations)[number] & { practiceSiteId: string } =>
          v.practiceSiteId !== undefined && v.practiceSiteId !== null,
      )
      .map((v) => ({
        practiceSiteId: v.practiceSiteId,
        status: this.classify(v.statusConceptId),
      }));
  }

  async tenantsOfSites(
    siteIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (siteIds.length === 0) return new Map();
    const rows = await this.em.execute<
      { site_id: string; tenant_id: string }[]
    >(
      `SELECT s.id AS site_id,
              COALESCE(s.managing_tenant_id, p.tenant_id) AS tenant_id
         FROM practice.practice_sites s
         JOIN practice.practices p ON p.id = s.practice_id
        WHERE s.id IN (?)`,
      [siteIds],
    );
    return new Map(rows.map((row) => [row.site_id, row.tenant_id]));
  }

  private classify(statusConceptId: string): AffiliationStatus {
    const match = STATUS_BY_STATE.find(([state]) =>
      esEstado(statusConceptId, state),
    );
    return match ? match[1] : 'OTHER';
  }
}
